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
		data, token, uri, webhook;

	if (req) {
		data = req.body;
		token = data[config.token];
		delete data[config.token];
	} else {
		data = desc.message;
		token = stores.webhooks.indexes.name[desc.channel.replace(regex.send, "").replace(config.id + "_", "")];
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
			data += "&" + config.token + "=" + webhook.id;
		} else {
			data[config.token] = webhook.id;
		}

		if (encoding === "form") {
			request.post(uri).form(data);
		} else if (encoding === "querystring") {
			uri += (uri.indexOf("?") > -1 ? "&" : "?") + data.replace(/^(\&|\?)/, "");
			request.get(uri);
		} else if (encoding === "json") {
			request({method: "POST", json: true, body: data});
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
