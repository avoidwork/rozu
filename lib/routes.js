"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	collection = require(path.join(__dirname, "collection.js")),
	collectionItem = require(path.join(__dirname, "collectionItem.js")),
	clone = require(path.join(__dirname, "clone.js")),
	coap = require(path.join(__dirname, "coap.js")),
	profile = require(path.join(__dirname, "profile.js")),
	receive = require(path.join(__dirname, "receive.js")),
	regex = require(path.join(__dirname, "regex.js")),
	register = require(path.join(__dirname, "register.js")),
	send = require(path.join(__dirname, "send.js")),
	stores = require(path.join(__dirname, "stores.js")),
	user = require(path.join(__dirname, "user.js")),
	verify = require(path.join(__dirname, "verify.js"));

let ROOT_ROUTES = [];

/**
 * API routes
 *
 * @type Object
 */
const routes = {
	"delete": {
		"/profile": profile,
		"/users/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": user,
		"/verify/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": (req, res) => {
			collectionItem(req, res, "verify");
		},
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": (req, res) => {
			collectionItem(req, res, "webhooks");
		}
	},
	"get": {
		"/": (req, res) => {
			let session = req.session,
				headers;

			if (session && session.passport && session.passport.user) {
				headers = clone(req.server.config.headers);

				if (!regex.private.test(headers["cache-control"])) {
					headers["cache-control"] += "private, ";
				}

				res.send(ROOT_ROUTES, 200, headers);
			} else {
				res.send(["login", "receive", "register"]);
			}
		},
		"/admin": (req, res) => {
			let luser = req.session.passport.user;

			if (config.admin.includes(luser.email)) {
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
				res.send(stores.get("users").dump().map(i => {
					delete i.password;
					return i;
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
			collectionItem(req, res, "webhooks");
		}
	},
	patch: {
		"/profile": profile,
		"/webhooks/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}": (req, res) => {
			collectionItem(req, res, "webhooks", validation.webhooks);
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
			collectionItem(req, res, "webhooks", validation.webhooks);
		}
	},
	coap: {
		request: coap
	}
};

module.exports = routes;
