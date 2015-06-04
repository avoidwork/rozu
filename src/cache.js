/**
 * Gets and/or caches data
 *
 * @method cache
 * @param  {String} id   User ID
 * @param  {String} type DataStore type
 * @return {Object}      Deferred
 */
function cache ( id, type ) {
	var defer = deferred(),
		key = id + "_" + type,
		data = collections.get( key );

	if ( data ) {
		defer.resolve( data );
	}
	else {
		stores[ type ].select( { user_id: id } ).then( function ( recs ) {
			var data = recs.length === 0 ? [] : stores[ type ].dump( recs ).map( function ( i ) {
				delete i.user_id;
				return i;
			} );

			collections.set( id + "_" + type, data );
			defer.resolve( data );
		}, function ( e ) {
			defer.reject( e );
		} );
	}

	return defer;
}
