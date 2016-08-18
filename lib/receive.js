/**
 * Webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive (req, res, isCoap = false, payload) {
	let data = !isCoap ? clone(req.body) : payload,
		token = !isCoap ? req.parsed.query[config.token] || data[config.token] : data[config.token],
		webhook = token ? stores.webhooks.get(token) : undefined,
		result;

	if (!isCoap) {
		if (!token || !webhook || config.validate && webhook[1].host.indexOf(req.parsed.hostname) === -1) {
			res.error(401);
		} else if (data === undefined || !regex.payload.test(typeof data)) {
			res.error(400);
		} else {
			res.send(http.STATUS_CODES[202], 202);
			clientPublish.publish(config.id + "_" + webhook[1].name, serialize(data));
			sse.send({data: data, type: "inbound", webhook: webhook[1].name});
		}
	} else {
		if (!token || !webhook || config.validate && webhook[1].host.indexOf(req.parsed.hostname) === -1) {
			result = "4.01";
		} else if (data === undefined || !regex.payload.test(typeof data)) {
			result = "4.00";
		} else {
			result = "2.01";
			clientPublish.publish(config.id + "_" + webhook[1].name, serialize(data));
			sse.send({data: data, type: "inbound", webhook: webhook[1].name});
		}

		return result;
	}
}
