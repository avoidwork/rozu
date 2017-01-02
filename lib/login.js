"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
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
	let user = stores.get("users").find({email: username, active: true, verified: true}, true)[0];

	if (!user) {
		callback(new Error(config.error.invalid_credentials), null);
	} else {
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
