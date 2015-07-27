/**
 * Outbound webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive (req, res) {
	let data = clone(req.body, true),
		token = req.parsed.query[config.token] || data[config.token],
		webhook = token ? stores.webhooks.get(token) : undefined;

	if (!token || !webhook || (config.validate && webhook[1].host.indexOf(req.parsed.hostname) === -1)) {
		res.error(401);
	} else if (data === undefined || !regex.payload.test(typeof data)) {
		res.error(400);
	} else {
		res.respond("Accepted", 202);
		clientPublish.publish(config.id + "_" + webhook[1].name, serialize(data));
		sse.send({data: data, type: "inbound", webhook: webhook[1].name});
	}
}
