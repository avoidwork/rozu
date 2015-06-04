/**
 * Outbound webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive ( req, res ) {
	var token = req.parsed.query[config.token],
		record = token ? stores.webhooks.get( token ) : undefined;

	if ( !token || !record || record.data.host.indexOf( req.parsed.hostname ) === -1 ) {
		res.error( 401 );
	} else if ( req.body === undefined || !regex.payload.test( typeof req.body ) ) {
		res.error( 400 );
	} else {
		res.respond( "Accepted", 202 );

		// @todo redis
		// @todo SSE
	}
}
