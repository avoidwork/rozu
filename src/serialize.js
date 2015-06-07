/**
 * Serializes `arg` if required
 *
 * @method serialize
 * @param {Mixed} arg Input argument
 * @returns {String}  JSON String
 */
function serialize (arg) {
	var result;

	if (typeof arg === "string") {
		result = arg;
	} else {
		result = JSON.stringify(arg);
	}

	return result;
}
