/**
 * Outbound webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive (req, res) {
	var data = clone(req.body, true),
		token = req.parsed.query[config.token] || data[config.token],
		record = token ? stores.webhooks.get(token) : undefined;

	if (!token || !record || ( config.validate && record.data.host.indexOf(req.parsed.hostname) === -1 )) {
		res.error(401);
	} else if (data === undefined || !regex.payload.test(typeof data)) {
		res.error(400);
	} else {
		res.respond("Accepted", 202);

		if (data instanceof Object) {
			delete data[config.token];
		}

		client.publish(config.id + "_" + record.data.name, data);
		sse.send(data);
	}
}
