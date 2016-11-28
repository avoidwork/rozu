"use strict";

const array = require("retsu");

/**
 * Iterates an input and executes a function against it's properties/indices
 *
 * @method iterate
 * @param  {Object}   obj Input to iterate
 * @param  {Functino} fn  Function to execute
 * @return {Undefined}    undefined
 */
function iterate (obj, fn) {
	if (obj instanceof Object) {
		array.each(Object.keys(obj), i => {
			fn.call(obj, obj[i], i);
		});
	} else {
		array.each(obj, fn);
	}
}

module.exports = iterate;
