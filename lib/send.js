"use strict";

const deferred = require("tiny-defer"),
	request = require("request"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	iterate = require(path.join(__dirname, "iterate.js")),
	regex = require(path.join(__dirname, "regex.js")),
	sse = require(path.join(__dirname, "sse.js")),
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
	let defer = deferred(),
		valid = true,
		encoding = "json",
		http = require("http"),
		options = {method: "POST"},
		webhooks = stores.get("webhooks"),
		data, qdata, token, uri, webhook;

	function err (e) {
		if (n + 1 < config.retry.max) {
			setTimeout(() => {
				send(req, res, desc, ++n).then(() => {
					defer.resolve(true);
				}).catch(err);
			}, config.retry.delay);
		} else {
			defer.reject(e);
		}
	}

	function success (resp) {
		const event = {data: data, type: "outbound", webhook: webhook[1].name};

		iterate(["admin", webhook[1].user_id], i => sse(i).send(event));
		defer.resolve(resp);
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

		token = (webhooks.find({name: desc.channel.replace(regex.send, "").replace(config.id + "_", "")})[0] || [])[0];
	}

	webhook = webhooks.get(token) || [null, {}];

	if (!webhook[0]) {
		valid = false;
	} else {
		uri = webhook[1].uri;

		if (!uri) {
			valid = false;
		}
	}

	if (valid) {
		if (res) {
			res.send(http.STATUS_CODES[202], 202);
		}

		encoding = regex.encoding.test(webhook[1].encoding) ? webhook[1].encoding : "json";
		options.url = uri;

		if (webhook[1].headers) {
			options.headers = webhook[1].headers;
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
					qdata = Reflect.ownKeys(data).map(i => {
						return i + "=" + encodeURIComponent(data[i]);
					}).join("&");
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
			if (webhook[1].name) {
				res.error(400, webhook[1].name + " is not configured for outbound webhooks");
			} else {
				res.error(400);
			}
		}

		defer.reject(new Error("Mis-configured webhook"));
	}

	return defer.promise;
}

module.exports = send;
