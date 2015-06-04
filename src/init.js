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

	// Connecting to redis for inbound webhooks
	client = redis.createClient( config.session.redis.port, config.session.redis.host );
	client.on( "connect", function () {
		log( "Connected to redis", "debug" );
	} );

	client.on( "error", function ( e ) {
		log( e.message || e.stack || e, "error" );
	} );

	return tenso( config );
}
