/**
 * Collection update facade
 *
 * @method collection_update
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} user User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @param  {Object} data Record data
 * @param  {Object} msg  [Optional] Instruction
 * @return {Undefined}   undefined
 */
function collection_update ( req, res, user, type, key, data, msg ) {
	collections.remove( user + "_" + type );

	stores[ type ].set( key, data, false, req.method == "PUT" ).then( function ( rec ) {
		if ( !regex.invite.test( req.url ) ) {
			res.respond( {
				id: rec.key,
				instruction: ( msg || config.instruction.success ).replace( /\:id/g, rec.key )
			} );
		}
		else {
			res.respond( {
				instruction: ( msg || config.instruction.success ).replace( /\:id/g, rec.key )
			} );
		}
	}, function ( e ) {
		res.error( 500, e.message || e );
		log( e, "error" );
	} );
}
