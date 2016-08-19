"use strict";

const uuid = require("node-uuid").v1,
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	collectionRead = require(path.join(__dirname, "collectionRead.js")),
	collectionUpdate = require(path.join(__dirname, "collectionUpdate.js")),
	load = require(path.join(__dirname, "load.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Collection handler
 *
 * @method collection
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {String}   type Collection type
 * @param  {Function} fn   POST validation
 * @return {Undefined}     undefined
 */
function collection (req, res, type, fn) {
	let id = req.session.passport.user.id,
		data;

	if (req.method === "POST") {
		data = load(type, req.body);
		data.user_id = id;

		fn(data, e => {
			if (e) {
				res.error(400, e);
			} else {
				collectionUpdate(req, res, id, type, uuid(), data, config.instruction[type + "_new"]);
			}
		});
	} else if (req.session.admin) {
		res.send(stores.get(type).toArray(null, false));
	} else {
		collectionRead(req, res, id, type);
	}
}

module.exports = collection;
