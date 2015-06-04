/**
 * Login handler
 *
 * @method login
 * @param  {String} username Username
 * @param  {String} password Unencrypted password
 * @param  {String} callback Callback
 * @return {Undefined}       undefined
 */
function login ( username, password, callback ) {
	stores.users.select( { email: username, active: true, verified: true } ).then( function ( recs ) {
		var user;

		if ( recs.length === 0 ) {
			return callback( new Error( config.error.invalid_credentials ), null );
		}

		user = stores.users.dump( [ recs[ 0 ] ] )[ 0 ];

		password_compare( password, user.password, function ( e, match ) {
			if ( e ) {
				callback( e, null );
			}
			else if ( match ) {
				callback( null, user );
			}
			else {
				callback( new Error( config.error.invalid_credentials ), null );
			}
		} );
	}, function ( e ) {
		callback( e, null );
	} );
}
