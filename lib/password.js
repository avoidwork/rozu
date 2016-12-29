"use strict";

const bcrypt = require("bcrypt");

/**
 * Creates a hash of a password
 *
 * @method create
 * @param  {String}   password User input
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function create (password, callback) {
	bcrypt.genSalt(10, function (e, salt) {
		if (e) {
			callback(e, null);
		} else {
			bcrypt.hash(password, salt, callback);
		}
	});
}

/**
 * Compares user input with a known password
 *
 * @method compare
 * @param  {String}   password User input
 * @param  {String}   hash     Hash of password
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function compare (password, hash, callback) {
	bcrypt.compare(password, hash, callback);
}

module.exports = {
	compare: compare,
	create: create
};
