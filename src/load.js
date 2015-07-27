/**
 * Loads data from an Object
 *
 * @method load
 * @param  {String} type Type of Object
 * @param  {Object} obj  Object to load
 * @return {Object}      Validated shape
 */
function load (type, obj) {
	let result = {};

	array.each(config.valid[type] || [], function (i) {
		if (obj[i] !== undefined) {
			result[i] = obj[i];
		}
	});

	return result;
}
