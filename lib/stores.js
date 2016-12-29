"use strict";

const haro = require("haro"),
	haroMongo = require("haro-mongo"),
	merge = require("tiny-merge"),
	path = require("path"),
	array = require("retsu"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	redis = require(path.join(__dirname, "redis.js")),
	stores = new Map(),
	deferreds = [];

function init (cfg = {}) {
	return haro(null, merge(clone(config.defaults.store), cfg));
}

array.each(config.stores, i => {
	let store = init(i);

	stores.set(i.id, store);
	store.register("mongo", haroMongo);
	deferreds.push(store.load("mongo"));
});

Promise.all(deferreds).then(() => {
	array.each(stores.get("webhooks").dump(), i => {
		redis.sub.subscribe(config.id + "_" + i.name + "_send");
	});
});

module.exports = stores;
