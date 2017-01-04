"use strict";

const haro = require("haro"),
	haroMongo = require("haro-mongo"),
	merge = require("tiny-merge"),
	path = require("path"),
	iterate = require(path.join(__dirname, "iterate.js")),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	redis = require(path.join(__dirname, "redis.js")),
	stores = new Map(),
	deferreds = [];

function init (cfg = {}) {
	return haro(null, merge(clone(config.defaults.store), cfg));
}

function subscribe () {
	iterate(stores.get("webhooks").dump(), i => {
		redis.sub.subscribe(config.id + "_" + i.name + "_send");
	});
}

iterate(config.stores, i => {
	let store = init(i);

	stores.set(i.id, store);
	store.register("mongo", haroMongo);
	deferreds.push(store.load("mongo"));
});

Promise.all(deferreds).then(() => {
	if (redis.sub.connected) {
		subscribe();
	}

	redis.sub.on("connect", () => {
		subscribe();
	});
}).catch(() => void 0);

module.exports = stores;
