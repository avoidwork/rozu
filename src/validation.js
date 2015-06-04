/**
 * Validation functions
 *
 * @type {Object}
 */
var validation = {
	webhooks: function ( arg, cb ) {
		var result = !( ( typeof arg.name != "string" || arg.name === "" ) || ( typeof arg.host != "string" || arg.host === "" ) );

		if ( result ) {
			cb( null, true );
		}
		else {
			cb( new Error( config.error.invalid_arguments ), null );
		}
	}
};