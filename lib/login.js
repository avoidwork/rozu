"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	compare = require(path.join(__dirname, "password.js")).compare,
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Login handler
 *
 * @method login
 * @param  {String} username Username
 * @param  {String} password Unencrypted password
 * @param  {String} callback Callback
 * @return {Undefined}       undefined
 */
function login (username, password, callback) {
	let recs = stores.get("users").find({email: username, active: true, verified: true}),
		user;

	if (recs.length === 0) {
		callback(new Error(config.error.invalid_credentials), null);
	} else {
		user = clone(recs[0][1]);
		compare(password, user.password, (e, match) => {
			if (e) {
				callback(e, null);
			} else if (match) {
				callback(null, user);
			} else {
				callback(new Error(config.error.invalid_credentials), null);
			}
		});
	}
}

module.exports = login;
