/**
 * Collection item handler
 *
 * @method collection_item
 * @param  {Object}   req   Client request
 * @param  {Object}   res   Client response
 * @param  {String}   type  Collection type
 * @param  {Function} fn    [Optional] PATCH/PUT validation
 * @param  {Object}   links [Optional] Hash of links (HATEOAS)
 * @return {Undefined}      undefined
 */
function collection_item ( req, res, type, fn, links ) {
	var user = req.session.passport.user,
		id = req.body ? req.body[type.replace( regex.trailing_s, "" ) + "_id"] || req.url.replace( /.*\//, "" ) : req.url.replace( /.*\//, "" ),
		method = req.method,
		admin = req.session.admin === true,
		rec = stores[ type ].get( id ),
		data;

	if ( !rec || ( rec && rec.data.user_id !== user.id && !admin ) ) {
		return res.error( 404 );
	}

	if ( method == "DELETE" ) {
		collection_delete( req, res, user.id, type, id );
	}
	else if ( method == "GET" || method == "HEAD" || method == "OPTIONS" ) {
		rec = stores[ type ].dump( [ rec ] )[ 0 ];

		if ( !admin ) {
			delete rec.user_id;
		}

		if ( links !== undefined ) {
			iterate( links, function ( v, k ) {
				rec[k] = v.replace( /:id/g, id );
			} );
		}

		res.respond( rec );
	}
	else {
		if ( method === "PATCH" ) {
			try {
				data = jsonpatch( stores[ type ].get( id ).data, req.body );
			}
			catch ( e ) {
				return res.error( 400, e.message || e );
			}

			data = load( type, data );
		}
		else {
			data = load( type, req.body );
		}

		data.user_id = user.id;

		fn( data, function ( e ) {
			if ( e ) {
				res.error( 400, e.message || e );
			}
			else {
				collection_update( req, res, user.id, type, id, data );
			}
		}, method );
	}
}
