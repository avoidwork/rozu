"use strict";

const bcrypt = require("bcrypt");

/**
 * Compares user input with a known password
 *
 * @method password_compare
 * @param  {String}   password User input
 * @param  {String}   hash     Hash of password
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function passwordCompare (password, hash, callback) {
	bcrypt.compare(password, hash, callback);
}

module.exports = passwordCompare;
