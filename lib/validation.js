"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json"));

/**
 * Validation functions
 *
 * @type {Object}
 */
const validation = {
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
