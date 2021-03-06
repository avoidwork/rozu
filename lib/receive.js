"use strict";

const path = require("path"),
	http = require("http"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	regex = require(path.join(__dirname, "regex.js")),
	handle = require(path.join(__dirname, "handle.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive (req, res, isCoap = false, payload = undefined) {
	const data = !isCoap ? clone(req.body) : payload,
		token = !isCoap ? req.parsed.query[config.token] || data[config.token] : data[config.token],
		webhook = token ? stores.get("webhooks").get(token, true) : undefined;

	let result;

	if (!isCoap) {
		if (!token || !webhook || config.validate && !webhook.host.includes(req.parsed.hostname)) {
			res.error(401);
		} else if (data === undefined || !regex.payload.test(typeof data)) {
			res.error(400);
		} else {
			try {
				handle(webhook, data, "inbound");
				res.send(http.STATUS_CODES[202], 202);
			} catch (e) {
				res.send(e, 500);
			}
		}
	} else {
		if (!token || !webhook || config.validate && !webhook.host.includes(req.parsed.hostname)) {
			result = "4.01";
		} else if (data === undefined || !regex.payload.test(typeof data)) {
			result = "4.00";
		} else {
			try {
				handle(webhook, data, "inbound");
				result = "2.01";
			} catch (e) {
				result = "5.00";
			}
		}

		return result;
	}

	return void 0;
}

module.exports = receive;
