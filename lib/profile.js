"use strict";

const path = require("path"),
	jsonpatch = require("jsonpatch").apply_patch,
	iterate = require(path.join(__dirname, "iterate.js")),
	config = require(path.join(__dirname, "..", "config.json")),
	clone = require(path.join(__dirname, "clone.js")),
	error = require(path.join(__dirname, "error.js")),
	load = require(path.join(__dirname, "load.js")),
	password = require(path.join(__dirname, "password.js")),
	del = require(path.join(__dirname, "user.js")).delete,
	regex = require(path.join(__dirname, "regex.js")),
	stores = require(path.join(__dirname, "stores.js")),
	validation = require(path.join(__dirname, "validation.js")),
	invalid = ["active", "id", "password", "verified"];

/**
 * Profile handler
 *
 * @method profile
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function profile (req, res) {
	let user = req.session.passport.user,
		method = req.method,
		data, next;

	function sanitize (arg) {
		let result = clone(arg);

		iterate(invalid, i => {
			delete result[i];
		});

		return result;
	}

	if (method === "DELETE") {
		stores.get("users").del(user.id).then(() => {
			res.redirect("/logout");
			del(user.id);
		}, e => {
			error(req, res, e);
		});
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		res.send(sanitize(user));
	} else {
		if (method === "PATCH") {
			try {
				data = jsonpatch(sanitize(user), req.body);
			} catch (e) {
				data = {};
			}

			data = load("users", data);
		} else {
			data = load("users", req.body);
		}

		next = () => {
			validation.users(data, e => {
				if (e) {
					res.error(400, config.error.invalid_arguments);
				} else {
					stores.get("users").set(user.id, data, false, method === "PUT").then(rec => {
						req.session.passport.user = clone(rec[1]);
						res.send(config.instruction.success);
					}, err => {
						error(req, res, err);
					});
				}
			});
		};

		if (data.password === undefined) {
			next();
		} else if (regex.password.test(data.password) && req.body.old_password !== undefined && regex.password.test(req.body.old_password)) {
			password.compare(req.body.old_password, user.password, (e, match) => {
				if (e) {
					res.error(400, config.error.invalid_arguments);
				} else if (match) {
					password.create(data.password, (err, hash) => {
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

module.exports = profile;
