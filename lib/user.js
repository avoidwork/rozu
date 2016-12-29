"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	error = require(path.join(__dirname, "error.js")),
	stores = require(path.join(__dirname, "stores.js")),
	deferred = require("tiny-defer"),
	mpass = require("mpass"),
	uuid = require("uuid").v1,
	create = require(path.join(__dirname, "password.js")).create;

/**
 * User handler
 *
 * @method account
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function account (req, res) {
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

/**
 * Creates a new user account
 *
 * @method createUser
 * @param  {Object} args User attributes
 * @return {Object}      Promise
 */
function createUser (args) {
	let defer = deferred();

	if (!args.password) {
		args.password = mpass(3, true);
	}

	create(args.password, (e, hash) => {
		if (e) {
			defer.reject(e);
		} else {
			stores.get("users").set(uuid(), {
				firstname: args.firstname || "",
				lastname: args.lastname || "",
				email: args.email,
				password: hash,
				active: true,
				verified: false,
				verify_id: uuid()
			}).then(rec => {
				stores.get("verify").set(rec[1].verify_id, {user_id: rec[0]}).then(() => {
					defer.resolve({user: rec, password: args.password});
				}, defer.reject);
			}, defer.reject);
		}
	});

	return defer.promise;
}

module.exports = {
	account: account,
	create: createUser
};
