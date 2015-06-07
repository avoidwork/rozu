/**
 * Profile handler
 *
 * @method profile
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function profile ( req, res ) {
	var user = req.session.passport.user,
		method = req.method,
		data, next;

	if ( method == "DELETE" ) {
		stores.users.del( user.id ).then( function () {
			// Destroying the session
			res.redirect( "/logout" );

			// Removing entities owned by user
			iterate( stores, function ( store, key ) {
				if ( key !== "users" ) {
					cache( user.id, key ).then( function ( recs ) {
						collections.remove( user.id + "_" + key );
						store.batch( "del", recs.map( function ( i ) {
							return i.id;
						} ) ).then( null, function ( e ) {
							log( e, "error" );
						} );
					}, function ( e ) {
						log( e, "error" );
					} );
				}
			} );

			// Removing account from workforces
			array.each( stores.workforces.records, function ( i ) {
				if ( i.data.users && array.contains( i.data.users, user.id ) ) {
					collections.remove( i.data.user_id + "_workforces" );
					array.remove( i.data.users, user.id );
				}
			} );
		}, function ( e ) {
			res.error( 500, e.message || e );
			log( e, "error" );
		} );
	}
	else if ( method == "GET" || method == "HEAD" || method == "OPTIONS" ) {
		data = clone( user, true );
		delete data.active;
		delete data.id;
		delete data.password;
		delete data.verified;
		res.respond( data );
	}
	else {
		data = load( "users", req.body );
		next = function () {
			if ( method == "PATCH" && array.cast( data ).length === 0 ) {
				res.error( 400, config.error.invalid_arguments );
			}
			else if ( method == "PUT" && ( data.firstname === undefined || data.lastname === undefined || data.email === undefined || !regex.firstname.test( data.firstname ) || !regex.lastname.test( data.lastname ) || !regex.email.test( data.email ) ) ) {
				res.error( 400, config.error.invalid_arguments );
			}
			else {
				stores.users.set( user.id, data, false, method == "PUT" ).then( function ( rec ) {
					req.session.passport.user = stores.users.dump( [ rec ] )[ 0 ];
					res.respond( config.instruction.success );
				}, function ( e ) {
					res.error( 500, e.message || e );
					log( e, "error" );
				} );
			}
		};

		if ( data.password === undefined ) {
			next();
		}
		else if ( regex.password.test( data.password ) && req.body.old_password !== undefined && regex.password.test( req.body.old_password ) ) {
			password_compare( req.body.old_password, user.password, function ( e, match ) {
				if ( e ) {
					res.error( 400, config.error.invalid_arguments );
				}
				else if ( match ) {
					password_create( data.password, function ( e, hash ) {
						if ( e ) {
							res.error( 400, e.message || e );
						}
						else {
							data.password = hash;
							next();
						}
					} );
				}
				else {
					res.error( 400, config.error.invalid_arguments );
				}
			} );
		}
		else {
			res.error( 400, config.error.invalid_arguments );
		}
	}
}
