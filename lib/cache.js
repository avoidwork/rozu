"use strict";

const deferred = require("tiny-defer"),
	path = require("path"),
	clone = require(path.join(__dirname, "clone.js")),
	stores = require(path.join(__dirname, "stores.js")),
	collections = require(path.join(__dirname, "collections.js"));

function cache (id, type) {
	const defer = deferred(),
		key = id + "_" + type,
		cached = collections.get(key);

	let data;

	if (cached) {
		defer.resolve(clone(cached));
	} else {
		data = stores.get(type).find({user_id: id}, true);
		collections.set(key, data);
		defer.resolve(clone(data));
	}

	return defer.promise;
}

module.exports = cache;
