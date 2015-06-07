/**
 * Outbound webhook handler
 *
 * @method send
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @param  {Object} msg Redis sourced message {channel: "", message: ""}
 * @return {Undefined}  undefined
 */
function send (req, res, desc) {
	var err = false,
		encoding = "json",
		tmp = [],
		data, token, uri, webhook;

	if (req) {
		data = req.body;
		token = data[config.token];
		delete data[config.token];
	} else {
		data = json.decode(desc.message, true) || desc.message;
		token = stores.webhooks.indexes.name[desc.channel.replace(regex.send, "").replace(config.id + "_", "")][0];
	}

	webhook = stores.webhooks.get(token);

	if (!webhook) {
		err = true;
	} else {
		uri = webhook.data.uri;

		if (!uri) {
			err = true;
		}
	}

	if (!err) {
		encoding = regex.encoding.test(webhook.data.encoding) ? webhook.data.encoding : "json";

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
				});
			} else if (encoding === "querystring") {
				if (typeof data === "object") {
					array.each(Object.keys(data), function (i) {
						tmp.push(i + "=" + encodeURIComponent(data[i]));
					});
					data = tmp.join("&");
				}

				uri += (uri.indexOf("?") > -1 ? "&" : "?") + data.replace(/^(\&|\?)/, "");
				request.get(uri).on("error", function (e) {
					log(e, "error");
				});
			} else if (encoding === "json") {
				request({body: data, method: "POST", json: true, uri: uri}).on("error", function (e) {
					log(e, "error");
				});
			}
		} catch (e) {
			log(e, "error");
		}

		sse.send({data: data, type: "outbound", webhook: webhook.data.name});
	} else {
		if (res) {
			if (webhook.data.name) {
				res.error(400, webhook.data.name + " is not configured for outbound webhooks");
			} else {
				res.error(400);
			}
		}

		log((webhook.data.name || "Unknown") + " cannot be found, or is not configured for outbound webhooks", "error");
	}
}
