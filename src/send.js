/**
 * Outbound webhook handler
 *
 * @method send
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @param  {Object} msg Redis sourced message {channel: "", message: ""}
 * @return {Object}     Deferred
 */
function send (req, res, desc) {
	let defer = deferred(),
		valid = true,
		encoding = "json",
		options = {method: "POST"},
		data, qdata, token, uri, webhook;

	function err (e) {
		log(e, "error");
		defer.reject(e);
	}

	function success (resp) {
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
			log(e.message, "debug");
			data = desc.message;
		}

		token = (stores.webhooks.find({name: desc.channel.replace(regex.send, "").replace(config.id + "_", "")})[0] || [])[0];
	}

	webhook = stores.webhooks.get(token) || [null, {}];

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
			res.respond("Accepted", 202);
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
					qdata = Object.keys(data).map(function (i) {
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

		sse.send({data: data, type: "outbound", webhook: webhook[1].name});
	} else {
		if (res) {
			if (webhook[1].name) {
				res.error(400, webhook[1].name + " is not configured for outbound webhooks");
			} else {
				res.error(400);
			}
		}

		log((webhook[1].name || "Unknown") + " cannot be found, or is not configured for outbound webhooks", "error");
		defer.reject(new Error("Misconfigured webhook"));
	}

	return defer.promise;
}
