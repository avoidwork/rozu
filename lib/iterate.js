"use strict";

/**
 * Iterates an input and executes a function against it's properties/indices
 *
 * @method iterate
 * @param  {Object}   obj Input to iterate
 * @param  {Functino} fn  Function to execute
 * @return {Undefined}    undefined
 */
function iterate(obj, fn) {
	if (obj instanceof Object) {
		Object.keys(obj).forEach(i => {
			fn.call(obj, obj[i], i);
		});
	} else {
		obj.forEach(fn);
	}
}

module.exports = iterate;
