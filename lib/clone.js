"use strict";

/**
 * Shallow clones the input
 *
 * @method clone
 * @param  {Mixed} arg Input to clone
 * @return {Mixed}     Clone of input
 */
function clone (arg) {
	return JSON.parse(JSON.stringify(arg));
}

module.exports = clone;
