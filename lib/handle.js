"use strict";

const path = require("path"),
	uuid = require("uuid").v1,
	config = require(path.join(__dirname, "..", "config.json")),
	iterate = require(path.join(__dirname, "iterate.js")),
	redis = require(path.join(__dirname, "redis.js")),
	serialize = require(path.join(__dirname, "serialize.js")),
	sse = require(path.join(__dirname, "sse.js"));

/**
 * Event handler
 *
 * @method handle
 * @param  {Object} webhook Webhook record
 * @param  {Object} data    Event data
 * @param  {String} type    Type of event
 * @return {Undefined}  undefined
 */
function handle (webhook, data, uid, type = "inbound") {
	const id = uuid(),
		body = serialize(data),
		event = {data: body, type: type, webhook_id: webhook.id, webhook: webhook.name, id: id, delivered: true};

	try {
		redis.pub.publish(config.id + "_" + webhook.name, body);
		iterate(["admin", uid], i => sse(i).send(event));
	} catch (e) {
		iterate(["admin", uid], i => sse(i).send({type: "error", data: e.stack || e.message || e}));
	}
}

module.exports = handle;
