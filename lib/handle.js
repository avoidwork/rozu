"use strict";

const path = require("path"),
	uuid = require("uuid").v1,
	config = require(path.join(__dirname, "..", "config.json")),
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
function handle (webhook, data, type = "inbound") {
	const id = uuid(),
		body = serialize(data),
		event = {
			pid: process.pid,
			data: body,
			type: type,
			webhook: webhook,
			id: id,
			delivered: true
		};

	let ev;

	try {
		redis.pub.publish(config.id + "_" + webhook.name, body);
		redis.pub.publish(config.id + "_sse", event);
		sse("admin").send(event);
		sse(webhook.user_id).send(event);
	} catch (e) {
		ev = {
			pid: process.pid,
			user_id: webhook.user_id,
			webhook: webhook,
			type: "error",
			id: id,
			data: e.stack || e.message || e
		};

		redis.pub.publish(config.id + "_sse", ev);
		sse("admin").send(ev);
		sse(webhook.user_id).send(ev);
	}
}

module.exports = handle;
