"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Collection deletion facade
 *
 * @method collection_delete
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} user User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @return {Undefined}   undefined
 */
function collectionDelete (req, res, user_id, type, key) {
	collections.remove(user_id + "_" + type);
	stores.get(type).del(key).then(() => {
		res.send(config.instruction.success);
	}, e => {
		res.error(500, e);
		req.server.log(e, "error");
		sse.send({type: "error", data: e.stack || e.message || e});
	});
}

module.exports = collectionDelete;
