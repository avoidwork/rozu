/**
 * API routes
 *
 * @type Object
 */
var routes = {
	"delete": {
		"/profile": profile,
		"/users/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": user,
		"/verify/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": function (req, res) {
			collection_item(req, res, "verify");
		},
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": function (req, res) {
			collection_item(req, res, "webhooks");
		}
	},
	"get": {
		"/": function (req, res) {
			var session = req.session,
				headers;

			if (session && session.passport && session.passport.user) {
				headers = clone(req.server.config.headers, true);

				headers["cache-control"] = "private " + headers["cache-control"];
				res.respond(ROOT_ROUTES, 200, headers);
			} else {
				res.respond(["/login", "/receive", "/register"]);
			}
		},
		"/admin": function (req, res) {
			var user = req.session.passport.user;

			if (array.contains(config.admin, user.email)) {
				req.session.admin = true;
				res.redirect("/");
			} else {
				res.error(403);
			}
		},
		"/profile": profile,
		"/receive": {
			"instruction": config.instruction.receive
		},
		"/register": {
			"instruction": config.instruction.register
		},
		"/send": {
			"instruction": config.instruction.send
		},
		"/stream": sse.init,
		"/users(\/?)": function (req, res) {
			if (req.session.admin) {
				res.respond(stores.users.dump().map(function (i) {
					delete i.password;
					return i;
				}));
			} else {
				res.error(403);
			}
		},
		"/users/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": user,
		"/verify(\/?)": config.instruction.verify_endpoint,
		"/verify/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": verify,
		"/webhooks(\/?)": function (req, res) {
			collection(req, res, "webhooks");
		},
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": function (req, res) {
			collection_item(req, res, "webhooks");
		}
	},
	patch: {
		"/profile": profile,
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": function (req, res) {
			collection_item(req, res, "webhooks", validation.webhooks);
		}
	},
	post: {
		"/register": register,
		"/receive": receive,
		"/send": send,
		"/webhooks(\/?)": function (req, res) {
			collection(req, res, "webhooks", validation.webhooks);
		}
	},
	put: {
		"/profile": profile,
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": function (req, res) {
			collection_item(req, res, "webhooks", validation.webhooks);
		}
	}
};
