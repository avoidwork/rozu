/**
 * Webhook API/server for inbound & outbound events
 *
 * @copyright 2016 Jason Mulligan <jason.mulligan@avoidwork.com>
 * @link http://avoidwork.github.io/rozu
 * @module rozu
 * @version 3.1.2
 */
const path = require("path"),
	ROOT = path.join(__dirname, ".."),
	VERSION = "3.1.2",
	SSE = require("express-sse"),
	deferred = require("tiny-defer"),
	array = require("retsu"),
	tenso = require("tenso"),
	bcrypt = require("bcrypt"),
	redis = require("redis"),
	nodemailer = require("nodemailer"),
	uuid = require("node-uuid").v1,
	mpass = require("mpass"),
	config = require(path.join(ROOT, "config.json")),
	jsonpatch = require("jsonpatch").apply_patch,
	request = require("request"),
	haro = require("haro"),
	haro_mongo = require("haro-mongo"),
	lru = require("tiny-lru");

let ROOT_ROUTES = [],
	collections = lru(config.collection || 1000),
	sse = new SSE(),
	app, mta, clientPublish, clientSubscribe;

/**
 * RegExp cache of common test patterns
 *
 * @type Object
 */
let regex = {
	email: /\w*@\w*/,
	encoding: /form|json|querystring/,
	extension: /\..*$/,
	firstname: /(\w*){1,}/,
	invite: /^\/invite/,
	lastname: /(\w*){2,}/,
	payload: /string|object/,
	send: /_send$/,
	std_port: /^(80|443)$/,
	trailing_s: /s$/,
	trailing_slash: /\/$/,
	uri_collection: /.*\//
};

/**
 * Shallow clones the input
 *
 * @method clone
 * @param  {Mixed} arg Input to clone
 * @return {Mixed}     Clone of input
 */
function clone (arg) {
	return JSON.parse(JSON.stringify(arg));
}

/**
 * Iterates an input and executes a function against it's properties/indices
 *
 * @method iterate
 * @param  {Object}   obj Input to iterate
 * @param  {Functino} fn  Function to execute
 * @return {Undefined}    undefined
 */
function iterate (obj, fn) {
	if (obj instanceof Object) {
		Object.keys(obj).forEach(function (i) {
			fn.call(obj, obj[i], i);
		});
	} else {
		obj.forEach(fn);
	}
}

/**
 * Logs a message through tenso
 *
 * @param {Mixed}  arg   String or Error
 * @param {String} level [Optional] Log level, default is "info"
 */
function log (arg, level) {
	app.server.log(arg, level);

	if (level === "error") {
		sse.send({type: "error", data: arg.stack || arg.message || arg});
	}
}

/**
 * Returns a merged of cloned inputs
 *
 * @method merge
 * @param  {Mixed} a Input to merge
 * @param  {Mixed} b Input to merge
 * @return {Mixed}   Merged of cloned inputs
 */
function merge (a, b) {
	let c = a !== undefined ? clone(a) : a,
		d = b !== undefined ? clone(b) : b;

	if (c instanceof Object && b instanceof Object) {
		Object.keys(d).forEach(function (i) {
			if (c[i] instanceof Object && d[i] instanceof Object) {
				c[i] = merge(c[i], d[i]);
			} else if (c[i] instanceof Array && d[i] instanceof Array) {
				c[i] = c[i].concat(d[i]);
			} else {
				c[i] = d[i];
			}
		});
	} else if (c instanceof Array && d instanceof Array) {
		c = c.concat(d);
	} else {
		c = d;
	}

	return c;
}

/**
 * DataStores with persistent storage in MongoDB
 *
 * @type Object
 */
let stores = {
	webhooks: haro(null, merge(config.defaults.store, {id: "webhooks", index: ["user_id", "host", "name"]})),
	users: haro(null, merge(config.defaults.store, {id: "users", index: ["email", "active|email|verified"]})),
	verify: haro(null, merge(config.defaults.store, {id: "verify", index: ["user_id"]}))
};

/**
 * Gets and/or caches data
 *
 * @method cache
 * @param  {String} id   User ID
 * @param  {String} type DataStore type
 * @return {Object}      Promise
 */
function cache (id, type) {
	let defer = deferred(),
		key = id + "_" + type,
		data = collections.get(key),
		lstore = stores[type],
		ldata, recs;

	if (data) {
		defer.resolve(data);
	} else {
		recs = lstore.find({user_id: id});
		ldata = recs.length === 0 ? [] : lstore.toArray(recs, false).map(function (i) {
			delete i.user_id;
			return i;
		});

		collections.set(id + "_" + type, ldata);
		defer.resolve(ldata);
	}

	return defer.promise;
}

/**
 * Compares user input with a known password
 *
 * @method password_compare
 * @param  {String}   password User input
 * @param  {String}   hash     Hash of password
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function password_compare (password, hash, callback) {
	bcrypt.compare(password, hash, callback);
}

/**
 * Creates a hash of a password
 *
 * @method password_create
 * @param  {String}   password User input
 * @param  {Function} callback Callback function
 * @return {Undefined}         undefined
 */
function password_create (password, callback) {
	bcrypt.genSalt(10, function (e, salt) {
		if (e) {
			callback(e, null);
		} else {
			bcrypt.hash(password, salt, callback);
		}
	});
}

/**
 * Loads data from an Object
 *
 * @method load
 * @param  {String} type Type of Object
 * @param  {Object} obj  Object to load
 * @return {Object}      Validated shape
 */
function load (type, obj) {
	let result = {};

	array.each(config.valid[type] || [], function (i) {
		if (obj[i] !== undefined) {
			result[i] = obj[i];
		}
	});

	return result;
}

/**
 * Collection deletion facade
 *
 * @method collection_delete
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} user User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @return {Undefined}   undefined
 */
function collection_delete (req, res, user_id, type, key) {
	collections.remove(user_id + "_" + type);
	stores[type].del(key).then(function () {
		res.respond(config.instruction.success);
	}, function (e) {
		res.error(500, e);
		log(e, "error");
	});
}

/**
 * Collection update facade
 *
 * @method collection_update
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} luser User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @param  {Object} data Record data
 * @param  {Object} msg  [Optional] Instruction
 * @return {Undefined}   undefined
 */
function collection_update (req, res, luser, type, key, data, msg) {
	collections.remove(luser + "_" + type);

	stores[type].set(key, data, false, req.method === "PUT").then(function (rec) {
		let output = {
			instruction: (msg || config.instruction.success).replace(/\:id/g, rec[0])
		};

		if (!regex.invite.test(req.url)) {
			output.id = rec[0];
		}

		res.respond(output);
	}, function (e) {
		res.error(500, e);
		log(e, "error");
	});
}

/**
 * Collection item handler
 *
 * @method collection_item
 * @param  {Object}   req   Client request
 * @param  {Object}   res   Client response
 * @param  {String}   type  Collection type
 * @param  {Function} fn    [Optional] PATCH/PUT validation
 * @param  {Object}   links [Optional] Hash of links (HATEOAS)
 * @return {Undefined}      undefined
 */
function collection_item (req, res, type, fn, links) {
	let luser = req.session.passport.user,
		id = req.body ? req.body[type.replace(regex.trailing_s, "") + "_id"] || req.url.replace(/.*\//, "") : req.url.replace(/.*\//, ""),
		method = req.method,
		admin = req.session.admin === true,
		rec = stores[type].get(id),
		data, output;

	if (!rec || rec && rec[1].user_id !== luser.id && !admin) {
		return res.error(404);
	}

	if (method === "DELETE") {
		collection_delete(req, res, luser.id, type, id);
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		output = clone(rec[1]);

		if (!admin) {
			delete output.user_id;
		}

		if (links !== undefined) {
			iterate(links, function (v, k) {
				output[k] = v.replace(/:id/g, id);
			});
		}

		res.respond(output);
	} else {
		if (method === "PATCH") {
			try {
				data = jsonpatch(clone(rec[1]).output, req.body);
			} catch (e) {
				return res.error(400, e);
			}

			data = load(type, data);
		} else {
			data = load(type, req.body);
		}

		data.user_id = luser.id;

		fn(data, function (e) {
			if (e) {
				res.error(400, e);
			} else {
				collection_update(req, res, luser.id, type, id, data);
			}
		}, method);
	}
}

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
function collection_read (req, res, id, type) {
	cache(id, type).then(function (data) {
		let instruction = config.instruction[type + "_create"];

		res.respond(data.length > 0 ? data : instruction ? {instruction: instruction} : data);
	}, function (e) {
		res.error(500, e);
		log(e, "error");
	});
}

/**
 * Collection handler
 *
 * @method collection
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {String}   type Collection type
 * @param  {Function} fn   POST validation
 * @return {Undefined}     undefined
 */
function collection (req, res, type, fn) {
	let method = req.method,
		id = req.session.passport.user.id,
		data;

	if (method === "POST") {
		data = load(type, req.body);
		data.user_id = id;

		fn(data, function (e) {
			if (e) {
				res.error(400, e);
			} else {
				collection_update(req, res, id, type, uuid(), data, config.instruction[type + "_new"]);
			}
		});
	} else if (req.session.admin) {
		res.respond(stores[type].toArray(null, false));
	} else {
		collection_read(req, res, id, type);
	}
}

/**
 * Login handler
 *
 * @method login
 * @param  {String} username Username
 * @param  {String} password Unencrypted password
 * @param  {String} callback Callback
 * @return {Undefined}       undefined
 */
function login (username, password, callback) {
	let recs = stores.users.find({email: username, active: true, verified: true}),
		luser;

	if (recs.length === 0) {
		callback(new Error(config.error.invalid_credentials), null);
	} else {
		luser = clone(recs[0][1]);
		password_compare(password, luser.password, function (e, match) {
			if (e) {
				callback(e, null);
			} else if (match) {
				callback(null, luser);
			} else {
				callback(new Error(config.error.invalid_credentials), null);
			}
		});
	}
}

/**
 * Creates a new user account
 *
 * @method new_user
 * @param  {Object} args User attributes
 * @return {Object}      Promise
 */
function new_user (args) {
	let defer = deferred();

	if (!args.password) {
		args.password = mpass(3, true);
	}

	password_create(args.password, function (e, hash) {
		if (e) {
			defer.reject(e);
		} else {
			stores.users.set(uuid(), {
				firstname: args.firstname || "",
				lastname: args.lastname || "",
				email: args.email,
				password: hash,
				active: true,
				verified: false,
				verify_id: uuid()
			}).then(function (rec) {
				stores.verify.set(rec[1].verify_id, {user_id: rec[0]}).then(function () {
					defer.resolve({user: rec, password: args.password});
				}, function (err) {
					defer.reject(err);
				});
			}, function (err) {
				defer.reject(err);
			});
		}
	});

	return defer.promise;
}

/**
 * Sends a notification
 *
 * @method notify
 * @param  {String} type     Type of notice to send, defaults to 'email'
 * @param  {Object} data     Data describing the recipient (user record)
 * @param  {String} template Message template
 * @return {Object}          Promise
 */
function notify (type, data, template, uri) {
	let defer = deferred(),
		keys, text, html;

	if (type === "email") {
		text = clone(template.text);
		html = clone(template.html);
		keys = text.match(/({{.*}})/g);

		array.each(keys, function (i) {
			let r = new RegExp(i, "g"),
				k, v;

			if (i !== "{{verify}}") {
				k = i.replace(/{{|}}/g, "");
				v = data[k];
			} else {
				v = uri + "/verify/" + data.verify_id;
			}

			text = text.replace(r, v);
			html = html.replace(r, v);
		});

		if (mta) {
			mta.sendMail({
				from: config.email.from,
				to: data.email,
				subject: template.subject,
				text: text,
				html: html
			}, function (e, info) {
				if (e) {
					log(e, "error");
					defer.reject(e);
				} else {
					defer.resolve(info.response);
				}
			});
		} else {
			defer.resolve(true);
		}
	} else {
		defer.reject(false);
	}

	return defer.promise;
}

/**
 * Profile handler
 *
 * @method profile
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function profile (req, res) {
	let luser = req.session.passport.user,
		method = req.method,
		data, next;

	if (method === "DELETE") {
		stores.users.del(luser.id).then(function () {
			// Destroying the session
			res.redirect("/logout");

			// Removing entities owned by user
			iterate(stores, function (store, key) {
				if (key !== "users") {
					cache(luser.id, key).then(function (recs) {
						collections.remove(luser.id + "_" + key);
						store.batch("del", recs.map(function (i) {
							return i.id;
						})).then(null, function (e) {
							log(e, "error");
						});
					}, function (e) {
						log(e, "error");
					});
				}
			});
		}, function (e) {
			res.error(500, e);
			log(e, "error");
		});
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		data = clone(luser);
		delete data.active;
		delete data.id;
		delete data.password;
		delete data.verified;
		res.respond(data);
	} else {
		data = load("users", req.body);
		next = function () {
			if (method === "PATCH" && array.cast(data).length === 0) {
				res.error(400, config.error.invalid_arguments);
			} else if (method === "PUT" && (data.firstname === undefined || data.lastname === undefined || data.email === undefined || !regex.firstname.test(data.firstname) || !regex.lastname.test(data.lastname) || !regex.email.test(data.email))) {
				res.error(400, config.error.invalid_arguments);
			} else {
				stores.users.set(luser.id, data, false, method === "PUT").then(function (rec) {
					req.session.passport.user = clone(rec[1]);
					res.respond(config.instruction.success);
				}, function (e) {
					res.error(500, e);
					log(e, "error");
				});
			}
		};

		if (data.password === undefined) {
			next();
		} else if (regex.password.test(data.password) && req.body.old_password !== undefined && regex.password.test(req.body.old_password)) {
			password_compare(req.body.old_password, luser.password, function (e, match) {
				if (e) {
					res.error(400, config.error.invalid_arguments);
				} else if (match) {
					password_create(data.password, function (err, hash) {
						if (err) {
							res.error(400, err.message || err);
						} else {
							data.password = hash;
							next();
						}
					});
				} else {
					res.error(400, config.error.invalid_arguments);
				}
			});
		} else {
			res.error(400, config.error.invalid_arguments);
		}
	}
}

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
	let authenticated = req.session.passport !== undefined && req.session.passport.user !== undefined,
		limit = req.server.config.rate.limit,
		seconds;

	if (authenticated && settings.limit === limit) {
		seconds = parseInt(new Date().getTime() / 1000, 10);
		settings.limit = settings.limit * config.rate.multiplier.limit;
		settings.remaining = settings.limit - (limit - settings.remaining);
		settings.time_reset = settings.limit * config.rate.multiplier.reset;
		settings.reset = seconds + settings.time_reset;
	}

	return settings;
}

/**
 * Registration handler
 *
 * @method register
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function register (req, res) {
	let args;

	if (req.isAuthenticated()) {
		res.error(400, config.error.already_authenticated);
	} else if (req.body !== undefined) {
		args = load("users", req.body);

		if (stores.users.indexes.get("email").has(args.email)) {
			res.error(400, config.error.email_used);
		} else if (args.firstname === undefined || args.lastname === undefined || args.email === undefined || args.password === undefined || !regex.firstname.test(args.firstname) || !regex.lastname.test(args.lastname) || !regex.email.test(args.email) || !regex.password.test(args.password)) {
			res.error(400, config.error.invalid_arguments);
		} else {
			new_user(args).then(function (arg) {
				res.respond({user_id: arg.user[0], instruction: config.instruction.verify});
				notify("email", stores.users.toArray([arg.user])[0], config.template.email.verify, (req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol) + "//" + (req.headers["x-forwarded-protocol"] || req.parsed.host)).then(null, function (e) {
					log(e, "error");
				});
			}, function (e) {
				res.error(500, e);
				log(e, "error");
			});
		}
	} else {
		res.error(400, config.error.invalid_arguments);
	}
}

/**
 * User handler
 *
 * @method user
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function user (req, res) {
	let admin = req.session.admin,
		id = req.url.replace(/.*\//, ""),
		obj, output;

	if (!admin) {
		return res.error(403);
	}

	obj = stores.users.get(id);

	if (obj) {
		if (req.method === "DELETE") {
			stores.users.del(obj[0]).then(function () {
				res.respond(config.instruction.success);
			}, function (e) {
				res.error(500, e);
				log(e, "error");
			});
		} else {
			output = clone(obj[1]);
			delete output.password;
			res.respond(output);
		}
	} else {
		res.error(404);
	}
}

/**
 * Verify handler
 *
 * @method verify
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function verify (req, res) {
	let vid = req.url.replace(/.*\//, ""),
		vrec = stores.verify.get(vid),
		vuser = vrec ? stores.users.get(vrec[1].user_id) : null,
		luser;

	if (vuser) {
		luser = clone(vuser[1]);

		// Changing record shape
		luser.verified = true;
		delete luser.verify_id;

		// Overwriting record to remove the 'verified_id' property
		stores.users.set(vuser[0], luser, false, true).then(function () {
			stores.verify.del(vid).then(null, function (e) {
				log(e, "error");
			});
			res.respond({login_uri: "/login", "instruction": "Your account has been verified, please login"});
		}, function (e) {
			res.error(500, e);
			log(e, "error");
		});
	} else {
		res.error(404);
	}
}

/**
 * Serializes `arg` if required
 *
 * @method serialize
 * @param {Mixed} arg Input argument
 * @returns {String}  JSON String
 */
function serialize (arg) {
	let result;

	if (typeof arg === "string") {
		result = arg;
	} else {
		result = JSON.stringify(arg);
	}

	return result;
}

/**
 * Webhook handler
 *
 * @method receive
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function receive (req, res, isCoap = false, payload) {
	let data = !isCoap ? clone(req.body) : payload,
		token = !isCoap ? req.parsed.query[config.token] || data[config.token] : data[config.token],
		webhook = token ? stores.webhooks.get(token) : undefined,
		result;

	if (!isCoap) {
		if (!token || !webhook || config.validate && webhook[1].host.indexOf(req.parsed.hostname) === -1) {
			res.error(401);
		} else if (data === undefined || !regex.payload.test(typeof data)) {
			res.error(400);
		} else {
			res.respond("Accepted", 202);
			clientPublish.publish(config.id + "_" + webhook[1].name, serialize(data));
			sse.send({data: data, type: "inbound", webhook: webhook[1].name});
		}
	} else {
		if (!token || !webhook || config.validate && webhook[1].host.indexOf(req.parsed.hostname) === -1) {
			result = "4.01";
		} else if (data === undefined || !regex.payload.test(typeof data)) {
			result = "4.00";
		} else {
			result = "2.01";
			clientPublish.publish(config.id + "_" + webhook[1].name, serialize(data));
			sse.send({data: data, type: "inbound", webhook: webhook[1].name});
		}

		return result;
	}
}

function coap (req, res, coapServer, tensoServer) {
	let method = req.method,
		json = "application/json",
		header = {"Content-Format": json},
		invalidFormat = false,
		invalidSize = false,
		payload, output;

	if (method === "POST") {
		if (new Buffer(req.payload).byteLength >= tensoServer.server.config.maxBytes) {
			invalidSize = true;
		} else if (req.headers["Content-Format"] === json) {
			try {
				payload = JSON.parse(req.payload);
			} catch (e) {
				invalidFormat = true;
				tensoServer.server.log(e.stack, "debug");
			}
		} else {
			invalidFormat = true;
		}

		if (invalidSize) {
			res.code = "4.13";
		} else if (invalidFormat) {
			res.code = "4.15";
		} else {
			req.parsed = tensoServer.server.parse(req.url);
			res.code = receive(req, res, true, payload);
		}
	} else if (method === "GET") {
		if (req.headers.Accept !== json) {
			res.code = "4.06";
		} else {
			res.writeHead("2.05", header);
			output = tensoServer.serialize(undefined, {instruction: config.instruction.receive});
		}
	} else {
		res.code = "4.05";
	}

	res.end(output);
}

/**
 * Webhook sender
 *
 * @method send
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @param  {Object} msg Redis sourced message {channel: "", message: ""}
 * @return {Object}     Deferred
 */
function send (req, res, desc) {
	let defer = deferred(),
		valid = true,
		encoding = "json",
		options = {method: "POST"},
		data, qdata, token, uri, webhook;

	function err (e) {
		log(e, "error");
		defer.reject(e);
	}

	function success (resp) {
		defer.resolve(resp);
	}

	if (req) {
		data = req.body;
		token = data[config.token];
		delete data[config.token];
	} else {
		try {
			data = JSON.parse(desc.message);
		} catch (e) {
			log(e.message, "debug");
			data = desc.message;
		}

		token = (stores.webhooks.find({name: desc.channel.replace(regex.send, "").replace(config.id + "_", "")})[0] || [])[0];
	}

	webhook = stores.webhooks.get(token) || [null, {}];

	if (!webhook[0]) {
		valid = false;
	} else {
		uri = webhook[1].uri;

		if (!uri) {
			valid = false;
		}
	}

	if (valid) {
		if (res) {
			res.respond("Accepted", 202);
		}

		encoding = regex.encoding.test(webhook[1].encoding) ? webhook[1].encoding : "json";
		options.url = uri;

		if (webhook[1].headers) {
			options.headers = webhook[1].headers;
		}

		if (typeof data === "string") {
			data += "&" + config.token + "=" + webhook.key;
		} else {
			data[config.token] = webhook.key;
		}

		try {
			if (encoding === "form") {
				request(options).form(data).on("error", err).on("response", success);
			} else if (encoding === "querystring") {
				if (typeof data === "object") {
					qdata = Object.keys(data).map(function (i) {
						return i + "=" + encodeURIComponent(data[i]);
					}).join("&");
				}

				options.method = "GET";
				options.url += (uri.indexOf("?") > -1 ? "&" : "?") + qdata.replace(/^(\&|\?)/, "");
				request(options).on("error", err).on("response", success);
			} else if (encoding === "json") {
				options.body = data;
				options.json = true;
				request(options).on("error", err).on("response", success);
			}
		} catch (e) {
			err(e);
		}

		sse.send({data: data, type: "outbound", webhook: webhook[1].name});
	} else {
		if (res) {
			if (webhook[1].name) {
				res.error(400, webhook[1].name + " is not configured for outbound webhooks");
			} else {
				res.error(400);
			}
		}

		log((webhook[1].name || "Unknown") + " cannot be found, or is not configured for outbound webhooks", "error");
		defer.reject(new Error("Misconfigured webhook"));
	}

	return defer.promise;
}

/**
 * Validation functions
 *
 * @type {Object}
 */
let validation = {
	webhooks: function (arg, cb) {
		let result = !(typeof arg.name !== "string" || arg.name === "" || typeof arg.host !== "string" || arg.host === "");

		if (result) {
			cb(null, true);
		} else {
			cb(new Error(config.error.invalid_arguments), null);
		}
	}
};
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
		request: coap
	}
};

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

// Initializing the application
app = init(config);

log("Rozu API " + VERSION, "debug");

module.exports = app;
