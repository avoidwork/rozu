"use strict";

const deferred = require("tiny-defer"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	stores = require(path.join(__dirname, "stores.js")),
	collections = lru(config.collection || 1000);

function cache (id, type) {
	let defer = deferred(),
		key = id + "_" + type,
		data = collections.get(key),
		ldata, lstore, recs;

	if (data) {
		defer.resolve(data);
	} else {
		lstore = stores.get(type);
		recs = lstore.find({user_id: id});
		ldata = recs.length === 0 ? [] : lstore.toArray(recs, false).map(function (i) {
			delete i.user_id;
			return i;
		});
		collections.set(id + "_" + type, ldata);
		defer.resolve(ldata);
	}

	return defer.promise;
}

module.exports = cache;
