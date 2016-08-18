"use strict";

const deferred = require("tiny-defer"),
	mpass = require("mpass"),
	uuid = require("node-uuid").v1,
	path = require("path"),
	passwordCreate = require(path.join(__dirname, "passwordCreate.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Creates a new user account
 *
 * @method new_user
 * @param  {Object} args User attributes
 * @return {Object}      Promise
 */
function newUser (args) {
	let defer = deferred();

	if (!args.password) {
		args.password = mpass(3, true);
	}

	passwordCreate(args.password, (e, hash) => {
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

module.exports = newUser;
