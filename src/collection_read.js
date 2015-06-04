/**
 * Collection facade
 *
 * @method collection
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} id   User ID
 * @param  {String} type Collection type
 * @return {Undefined}   undefined
 */
function collection_read ( req, res, id, type ) {
	cache( id, type ).then( function ( data ) {
		var instruction = config.instruction[ type + "_create" ];

		res.respond( data.length > 0 ? data : instruction ? { instruction: instruction } : data );
	}, function ( e ) {
		res.error( 500, e );
		log( e, "error" );
	} );
}
