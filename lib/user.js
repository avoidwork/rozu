"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	error = require(path.join(__dirname, "error.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * User handler
 *
 * @method user
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function user (req, res) {
	let admin = req.session.admin,
		id = req.url.replace(/.*\//, ""),
		store = stores.get("users"),
		obj, output;

	if (!admin) {
		return res.error(403);
	}

	obj = store.get(id);

	if (obj) {
		if (req.method === "DELETE") {
			store.del(obj[0]).then(() => {
				res.send(config.instruction.success);
			}, e => {
				error(req, res, e);
			});
		} else {
			output = clone(obj[1]);
			delete output.password;
			res.send(output);
		}
	} else {
		res.error(404);
	}

	return void 0;
}

module.exports = user;
