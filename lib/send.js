"use strict";

const deferred = require("tiny-defer"),
	request = require("request"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	regex = require(path.join(__dirname, "regex.js")),
	handle = require(path.join(__dirname, "handle.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Webhook sender
 *
 * @method send
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {Object} desc Redis sourced message {channel: "", message: ""}
 * @return {Object}      Promise
 */
function send (req, res, desc, n = 1) {
	const defer = deferred(),
		http = require("http"),
		options = {method: "POST"},
		webhooks = stores.get("webhooks");

	let valid = true,
		encoding = "json",
		data, qdata, token, uri, webhook;

	function success (arg) {
		const event = {
			data: data,
			type: "outbound",
			webhook: webhook
		};

		handle(webhook, event, "outbound");
		defer.resolve(arg);
	}

	function err (e) {
		if (n + 1 < config.retry.max) {
			setTimeout(() => {
				send(req, res, desc, ++n).then(() => {
					success(true);
				}).catch(err);
			}, config.retry.delay);
		} else {
			defer.reject(e);
		}
	}

	if (req) {
		data = req.body;
		token = data[config.token];
		delete data[config.token];
	} else {
		try {
			data = JSON.parse(desc.message);
		} catch (e) {
			data = desc.message;
		}

		token = webhooks.find({
			name: desc.channel.replace(regex.send, "").replace(config.id + "_", "")
		})[0];
	}

	webhook = webhooks.get(token, true);

	if (!webhook) {
		valid = false;
	} else {
		uri = webhook.uri;

		if (!uri) {
			valid = false;
		}
	}

	if (valid) {
		if (res) {
			res.send(http.STATUS_CODES[202], 202);
		}

		encoding = regex.encoding.test(webhook.encoding) ? webhook.encoding : "json";
		options.url = uri;

		if (webhook.headers) {
			options.headers = webhook.headers;
		}

		if (typeof data === "string") {
			data += "&" + config.token + "=" + webhook.key;
		} else {
			data[config.token] = webhook.key;
		}

		try {
			if (encoding === "form") {
				request(options).form(data).on("error", err).on("response", success);
			} else if (encoding === "querystring") {
				if (typeof data === "object") {
					qdata = Reflect.ownKeys(data).map(i => i + "=" + encodeURIComponent(data[i])).join("&");
				}

				options.method = "GET";
				options.url += (uri.indexOf("?") > -1 ? "&" : "?") + qdata.replace(/^(\&|\?)/, "");
				request(options).on("error", err).on("response", success);
			} else if (encoding === "json") {
				options.body = data;
				options.json = true;
				request(options).on("error", err).on("response", success);
			}
		} catch (e) {
			err(e);
		}
	} else {
		if (res) {
			if (webhook.name) {
				res.error(400, webhook.name + " is not configured for outbound webhooks");
			} else {
				res.error(400);
			}
		}

		defer.reject(new Error("Mis-configured webhook"));
	}

	return defer.promise;
}

module.exports = send;
