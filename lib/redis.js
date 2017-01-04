"use strict";

const redis = require("redis"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	collections = require(path.join(__dirname, "collections.js")),
	send = require(path.join(__dirname, "send.js")),
	stores = require(path.join(__dirname, "stores.js")),
	sse = require(path.join(__dirname, "sse.js")),
	output = {
		pub: redis.createClient(config.session.redis.port, config.session.redis.host),
		sub: redis.createClient(config.session.redis.port, config.session.redis.host)
	};

output.sub.on("error", (...args) => {
	console.error(...args);
});

output.sub.on("connect", () => {
	output.sub.subscribe(config.id + "_reload");
	output.sub.subscribe(config.id + "_sse");
});

output.sub.on("message", (channel, message) => {
	let data;

	try {
		data = JSON.parse(message);
	} catch (e) {
		console.error(e.stack || e.message || e);
		data = message;
	}

	if (data.pid !== process.pid) {
		if (channel === config.id + "_sse") {
			sse("admin").send(data);

			if (data.user_id) {
				sse(data.user_id).send(data);
			}
		} else if (channel === config.id + "_reload") {
			stores.get(data.store).load("mongo").then(() => {
				collections.clear();
			}).catch(e => {
				console.error(e.stack || e.message || e);
			});
		} else {
			send(null, null, {channel: channel, message: message});
		}
	}
});

module.exports = output;
