var expect = require('chai').expect,
    hippie = require( "hippie" ),
    app    = require( "app" ),
    array  = require( "keigai" ).util.array;

function api ( port, not_json ) {
	var obj = hippie().base("http://localhost:" + port)

	return not_json ? obj : obj.expectHeader("Content-Type", "application/json").json();
}

function persistCookies ( opts, next ) {
	opts.jar = true;
	next( opts );
}

describe("Permissions", function () {
	var port = 8001;

	tenso( {port: port, routes: routes, logs: {level: "error"}} );

	describe( "GET /", function () {
		it( "returns an array of endpoints", function ( done ) {
			api( port )
				.get( "/" )
				.expectStatus( 200 )
				.expectHeader( "allow", "GET, HEAD, OPTIONS" )
				.expectValue( "data.link", [
					{uri: "http://localhost:" + port + "/items", rel: "item"}
				] )
				.expectValue( "data.result", null )
				.expectValue( "error", null )
				.expectValue( "status", 200 )
				.end( function ( err ) {
					if ( err ) throw err;
					done();
				} );
		} );
	} );
});