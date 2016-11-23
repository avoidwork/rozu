"use strict";

const haro = require("haro"),
	haroMongo = require("haro-mongo"),
	merge = require("tiny-merge"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	redis = require(path.join(__dirname, "redis.js")),
	stores = new Map(),
	deferreds = [];

function init (cfg = {}) {
	return haro(null, merge(clone(config.defaults.store), cfg));
}

config.stores.forEach(i => {
	stores.set(i.id, init(i));
});

stores.forEach(i => {
	i.register("mongo", haroMongo);
	deferreds.push(i.load("mongo"));
});

Promise.all(deferreds).then(() => {
	stores.get("webhooks").toArray(null, false).forEach(i => {
		redis.sub.subscribe(config.id + "_" + i.name + "_send");
	});
});

module.exports = stores;
