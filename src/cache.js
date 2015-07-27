/**
 * Gets and/or caches data
 *
 * @method cache
 * @param  {String} id   User ID
 * @param  {String} type DataStore type
 * @return {Object}      Promise
 */
function cache (id, type) {
	let defer = deferred(),
		key = id + "_" + type,
		data = collections.get(key),
		lstore = stores[type];

	if (data) {
		defer.resolve(data);
	} else {
		lstore.find({user_id: id}).then(function (recs) {
			let ldata = recs.length === 0 ? [] : lstore.toArray(recs).map(function (i) {
				delete i.user_id;
				return i;
			});

			collections.set(id + "_" + type, ldata);
			defer.resolve(ldata);
		}, function (e) {
			defer.reject(e);
		});
	}

	return defer.promise;
}
