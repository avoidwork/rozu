"use strict";

const path = require("path"),
	uuid = require("uuid").v1,
	config = require(path.join(__dirname, "..", "config.json")),
	serialize = require(path.join(__dirname, "serialize.js")),
	sse = require(path.join(__dirname, "sse.js"));

let redis;

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

	if (!redis) { // lazy loading due to a node error
		redis = require(path.join(__dirname, "redis.js"));
	}

	try {
		redis.pub.publish(config.id + "_" + webhook.name, JSON.stringify(body, null, 0));
		redis.pub.publish(config.id + "_sse", JSON.stringify(event, null, 0));
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

		console.error(ev);
		redis.pub.publish(config.id + "_sse", JSON.stringify(ev, null, 0));
		sse("admin").send(ev);
		sse(webhook.user_id).send(ev);
	}
}

module.exports = handle;
