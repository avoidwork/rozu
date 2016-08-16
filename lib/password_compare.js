/**
 * Compares user input with a known password
 *
 * @method password_compare
 * @param  {String}   password User input
 * @param  {String}   hash     Hash of password
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function password_compare (password, hash, callback) {
	bcrypt.compare(password, hash, callback);
}
