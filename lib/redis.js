"use strict";

const redis = require("redis"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	send = require(path.join(__dirname, "send.js")),
	sse = require(path.join(__dirname, "sse.js")),
	output = {
		pub: redis.createClient(config.session.redis.port, config.session.redis.host),
		sub: redis.createClient(config.session.redis.port, config.session.redis.host)
	};

output.sub.on("message", (channel, message) => {
	let data;

	if (channel === config.id + "_sse") {
		try {
			data = JSON.parse(message);
		} catch (e) {
			data = message;
		}

		if (data.pid !== process.pid) {
			sse("admin").send(data);

			if (data.user_id) {
				sse(data.user_id).send(data);
			}
		}
	} else {
		send(null, null, {channel: channel, message: message});
	}
});

module.exports = output;
