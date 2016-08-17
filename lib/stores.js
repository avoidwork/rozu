"use strict";

const haro = require("haro"),
	merge = require("tiny-merge"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	stores = new Map();

function init (cfg = {}) {
	return haro(null, merge(clone(config.default.store), cfg));
}

stores.set("webhooks", init({
	id: "webhooks",
	index: ["user_id", "host", "name"]
}));

stores.set("users", init({
	id: "users",
	index: ["email", "active|email|verified"]
}));

stores.set("verify", init({
	id: "verify",
	index: ["user_id"]
}));

module.exports = stores;

