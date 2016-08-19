"use strict";

const redis = require("redis"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	send = require(path.join(__dirname, "send.js")),
	output = {
		pub: redis.createClient(config.session.redis.port, config.session.redis.host),
		sub: redis.createClient(config.session.redis.port, config.session.redis.host)
	};

// Setting a message handler to route outbound webhooks
output.sub.on("message", (channel, message) => {
	send(null, null, {channel: channel, message: message});
});

module.exports = output;
