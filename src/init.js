/**
 * Initializes the application
 *
 * @method init
 * @param  {Object} lconfig Tenso lconfig
 * @return {Object} Tenso instance
 */
function init (lconfig) {
	let deferreds = [];

	if (lconfig.email.host && lconfig.email.host !== "smtp.host") {
		mta = nodemailer.createTransport({
			host: lconfig.email.host,
			port: lconfig.email.port,
			secure: lconfig.email.secure,
			auth: {
				user: lconfig.email.user,
				pass: lconfig.email.pass
			}
		});
	}

	// Caching authenticated root route
	ROOT_ROUTES = clone(lconfig.auth.protect).concat(["logout", "receive"]).sort();

	lconfig.routes = routes;
	lconfig.auth.local.auth = login;
	lconfig.rate.override = rate;

	// Instantiating password validation
	regex.password = new RegExp(lconfig.password);

	// Loading DataStores
	iterate(stores, function (i) {
		i.register("mongo", haro_mongo);
		deferreds.push(i.load("mongo"));
	});

	Promise.all(deferreds).then(function () {
		log("DataStores loaded", "debug");

		// Subscribing to outbound channels
		array.each(stores.webhooks.get(), function (i) {
			clientSubscribe.subscribe(lconfig.id + "_" + i[1].name + "_send");
		});
	}, function (e) {
		log("Failed to load DataStores", "error");
		log(e, "error");
		process.exit(1);
	});

	// Connecting to redis for inbound/outbound webhooks
	clientPublish = redis.createClient(lconfig.session.redis.port, lconfig.session.redis.host);
	clientSubscribe = redis.createClient(lconfig.session.redis.port, lconfig.session.redis.host);

	array.each([clientPublish, clientSubscribe], function (i, idx) {
		i.on("connect", function () {
			log("Connected to redis to " + (idx === 0 ? "publish inbound" : "subscribe to outbound") + " webhooks", "debug");
		});

		i.on("error", function (e) {
			log(e.message || e.stack || e, "error");
		});
	});

	// Setting a message handler to route outbound webhooks
	clientSubscribe.on("message", function (channel, message) {
		send(null, null, {channel: channel, message: message});
	});

	return tenso(lconfig);
}
