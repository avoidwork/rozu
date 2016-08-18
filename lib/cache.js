"use strict";

const deferred = require("tiny-defer"),
	path = require("path"),
	stores = require(path.join(__dirname, "stores.js")),
	collections = require(path.join(__dirname, "collections.js"));

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
		ldata = recs.length === 0 ? [] : lstore.toArray(recs, false).map(i => {
			delete i.user_id;
			return i;
		});
		collections.set(key, ldata);
		defer.resolve(ldata);
	}

	return defer.promise;
}

module.exports = cache;
