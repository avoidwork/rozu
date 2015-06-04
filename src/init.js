/**
 * Initializes the application
 *
 * @method init
 * @param  {Object} config Tenso config
 * @return {Object} Tenso instance
 */
function init ( config ) {
	var deferreds = [];

	mta = nodemailer.createTransport( {
		host: config.email.host,
		port: config.email.port,
		secure: config.email.secure,
		auth: {
			user: config.email.user,
			pass: config.email.pass
		}
	} );

	// Caching authenticated root route
	ROOT_ROUTES = clone( config.auth.protect, true ).concat( [ "/logout", "/receive" ] ).sort( array.sort );

	config.routes = routes;
	config.auth.local.auth = login;
	config.rate.override = rate;

	// Loading datastores
	iterate( stores, function ( i ) {
		deferreds.push( i.restore() );
	} );

	when( deferreds ).then( function () {
		log( "DataStore loaded", "debug" );
	}, function ( e ) {
		log( "Failed to load DataStore", "error" );
		log( e, "error" );
		process.exit( 1 );
	} );

	return tenso( config );
}
