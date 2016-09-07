"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	regex = require(path.join(__dirname, "regex.js"));

/**
 * Validation functions
 *
 * @type {Object}
 */
const validation = {
	users: (arg, cb) => {
		let result = !(typeof arg.firstname !== "string" || typeof arg.lastname !== "string" || typeof arg.email !== "string" || !regex.firstname.test(arg.firstname) || !regex.lastname.test(arg.lastname) || !regex.email.test(arg.email));

		if (typeof arg.password !== "undefined" && (typeof arg.password !== "string" || !regex.password.test(arg.password))) {
			result = false;
		}

		if (result) {
			cb(null, true);
		} else {
			cb(new Error(config.error.invalid_arguments), null);
		}
	},
	webhooks: function (arg, cb) {
		let result = !(typeof arg.name !== "string" || arg.name === "" || typeof arg.host !== "string" || arg.host === "");

		if (result) {
			cb(null, true);
		} else {
			cb(new Error(config.error.invalid_arguments), null);
		}
	}
};

module.exports = validation;
