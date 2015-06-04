/**
 * Outbound webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive ( req, res ) {
	var token = req.parsed.query.token;

	if ( !token || stores.webhooks.indexes.key[ token ] === undefined ) {
		res.error( 401 );
	} else if ( req.body === undefined || !regex.payload.test( typeof req.body ) ) {
		res.error( 400 );
	} else {
		res.respond( "Accepted", 202 );

		// @todo redis
		// @todo SSE
	}
}
