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
		err = false,
		encoding = "json",
		data, qdata, token, uri, webhook;

	if (req) {
		data = req.body;
		token = data[config.token];
		delete data[config.token];
	} else {
		try {
			data = JSON.parse(desc.message);
		} catch (e) {
			log(e, "error");
			data = desc.message;
		}

		token = stores.webhooks.indexes.name[desc.channel.replace(regex.send, "").replace(config.id + "_", "")][0];
		// token = stores.wobhooks.indexes.get('name'); ?
	}

	webhook = stores.webhooks.get(token) || [null, {}];

	if (!webhook[0]) {
		err = true;
	} else {
		uri = webhook[1].uri;

		if (!uri) {
			err = true;
		}
	}

	if (!err) {
		encoding = regex.encoding.test(webhook[1].encoding) ? webhook[1].encoding : "json";

		if (res) {
			res.respond("Accepted", 202);
		}

		if (typeof data === "string") {
			data += "&" + config.token + "=" + webhook.key;
		} else {
			data[config.token] = webhook.key;
		}

		try {
			if (encoding === "form") {
				request.post(uri).form(data).on("error", function (e) {
					log(e, "error");
					defer.reject(e);
				}).on("response", function (resp) {
					defer.resolve(resp);
				});
			} else if (encoding === "querystring") {
				if (typeof data === "object") {
					qdata = Object.keys(data).map(function (i) {
						return i + "=" + encodeURIComponent(data[i]);
					}).join("&");
				}

				uri += (uri.indexOf("?") > -1 ? "&" : "?") + qdata.replace(/^(\&|\?)/, "");
				request.get(uri).on("error", function (e) {
					log(e, "error");
					defer.reject(e);
				}).on("response", function (resp) {
					defer.resolve(resp);
				});
			} else if (encoding === "json") {
				request({body: data, method: "POST", json: true, uri: uri}).on("error", function (e) {
					log(e, "error");
					defer.reject(e);
				}).on("response", function (resp) {
					defer.resolve(resp);
				});
			}
		} catch (e) {
			log(e, "error");
			defer.reject(e);
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
