"use strict";

const each = require("retsu").each;

/**
 * Iterates an input and executes a function against it's properties/indices
 *
 * @method iterate
 * @param  {Object}   obj Input to iterate
 * @param  {Functino} fn  Function to execute
 * @return {Undefined}    undefined
 */
function iterate (obj, fn) {
	if (obj instanceof Array) {
		each(obj, (i, idx) => fn(i, idx));
	} else {
		each(Reflect.ownKeys(obj), i => fn(obj[i], i));
	}
}

module.exports = iterate;
