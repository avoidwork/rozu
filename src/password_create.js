/**
 * Creates a hash of a password
 *
 * @method password_create
 * @param  {String}   password User input
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function password_create ( password, callback ) {
	bcrypt.genSalt( 10, function ( e, salt ) {
		if ( e ) {
			return callback( e, null );
		}

		bcrypt.hash( password, salt, function ( e, hash ) {
			return callback( e, hash );
		} );
	} );
}
