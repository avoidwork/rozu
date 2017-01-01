"use strict";

const path = require("path"),
	uuid = require("uuid").v1,
	config = require(path.join(__dirname, "..", "config.json")),
	redis = require(path.join(__dirname, "redis.js")),
	serialize = require(path.join(__dirname, "serialize.js")),
	sse = require(path.join(__dirname, "sse.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Event handler
 *
 * @method handle
 * @param  {Object} webhook Webhook record
 * @param  {Object} data    Event data
 * @param  {String} type    Type of event
 * @return {Undefined}  undefined
 */
function handle (webhook, data, type = "inbound") {
	const id = uuid(),
		body = serialize(data),
		event = {data: body, type: type, webhook_id: webhook.id, webhook: webhook.name, id: id, delivered: true};

	try {
		redis.pub.publish(config.id + "_" + webhook.name, body);
		stores.get("log").set(id, event);
		sse.send(event);
	} catch (e) {
		sse.send({type: "error", data: e.stack || e.message || e});
	}
}

module.exports = handle;
