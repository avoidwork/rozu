/**
 * Rate limit override
 *
 * Looking at the session because the route might not be protected
 *
 * @method settings
 * @param  {Object} req      Client request
 * @param  {Object} settings settings settings (default/anon)
 * @return {Object}          Potentially modified settings settings
 */
function rate (req, settings) {
	var authenticated = ( req.session.passport !== undefined && req.session.passport.user !== undefined ),
		limit = req.server.config.rate.limit,
		seconds;

	if (authenticated && settings.limit === limit) {
		seconds = parseInt(new Date().getTime() / 1000, 10);
		settings.limit = settings.limit * config.rate.multiplier.limit;
		settings.remaining = settings.limit - ( limit - settings.remaining );
		settings.time_reset = settings.limit * config.rate.multiplier.reset;
		settings.reset = seconds + settings.time_reset;
	}

	return settings;
}
