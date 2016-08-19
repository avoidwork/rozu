"use strict";

/**
 * Serializes `arg` if required
 *
 * @method serialize
 * @param {Mixed} arg Input argument
 * @returns {String}  JSON String
 */
function serialize (arg) {
	let result;

	if (typeof arg === "string") {
		result = arg;
	} else {
		result = JSON.stringify(arg);
	}

	return result;
}

module.exports = serialize;
