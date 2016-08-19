"use strict";

const bcrypt = require("bcrypt");

/**
 * Creates a hash of a password
 *
 * @method password_create
 * @param  {String}   password User input
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function passwordCreate (password, callback) {
	bcrypt.genSalt(10, function (e, salt) {
		if (e) {
			callback(e, null);
		} else {
			bcrypt.hash(password, salt, callback);
		}
	});
}

module.exports = passwordCreate;
