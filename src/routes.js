const http = require("http");

/**
 * API routes
 *
 * @type Object
 */
const routes = {
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
		"/": (req, res) => {
			let session = req.session,
				headers;

			if (session && session.passport && session.passport.user) {
				headers = clone(req.server.config.headers);

				headers["cache-control"] = "private " + headers["cache-control"];
				res.respond(ROOT_ROUTES, 200, headers);
			} else {
				res.respond(["login", "receive", "register"]);
			}
		},
		"/admin": (req, res) => {
			let luser = req.session.passport.user;

			if (array.contains(config.admin, luser.email)) {
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
		"/users": (req, res) => {
			if (req.session.admin) {
				res.respond(stores.users.dump().map(i => {
					let o = i;

					delete o.password;
					return o;
				}));
			} else {
				res.error(403);
			}
		},
		"/users/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": user,
		"/verify": config.instruction.verify_endpoint,
		"/verify/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": verify,
		"/webhooks": (req, res) => {
			collection(req, res, "webhooks");
		},
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": (req, res) => {
			collection_item(req, res, "webhooks");
		}
	},
	patch: {
		"/profile": profile,
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": (req, res) => {
			collection_item(req, res, "webhooks", validation.webhooks);
		}
	},
	post: {
		"/register": register,
		"/receive": receive,
		"/send": send,
		"/webhooks": (req, res) => {
			collection(req, res, "webhooks", validation.webhooks);
		}
	},
	put: {
		"/profile": profile,
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": (req, res) => {
			collection_item(req, res, "webhooks", validation.webhooks);
		}
	},
	coap: {
		request: (req, res, coapServer, tensoServer) => {
			let method = req.method,
				result, status;

			if (method === "GET") {
				status = 200;
				result = tensoServer.serialize(undefined, {
					"instruction": config.instruction.receive
				});
			} else if (method === "POST") {
				status = 202;
				result = tensoServer.serialize(undefined, http.STATUS_CODE[status]);
			} else {
				status = 405;
				result = tensoServer.serialize(undefined, new Error(status));
			}

			res.writeHead(status, {"Content-Format": "application/json"});
			res.send(result);
		}
	}
};
