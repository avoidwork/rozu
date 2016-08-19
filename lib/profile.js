"use strict";

const path = require("path"),
	array = require("retsu"),
	config = require(path.join(__dirname, "..", "config.json")),
	cache = require(path.join(__dirname, "cache.js")),
	clone = require(path.join(__dirname, "clone.js")),
	collections = require(path.join(__dirname, "collections.js")),
	error = require(path.join(__dirname, "error.js")),
	load = require(path.join(__dirname, "load.js")),
	passwordCreate = require(path.join(__dirname, "passwordCreate.js")),
	passwordCompare = require(path.join(__dirname, "passwordCompare.js")),
	regex = require(path.join(__dirname, "regex.js")),
	stores = require(path.join(__dirname, "stores.js"));

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

	if (method === "DELETE") {
		stores.get("users").del(user.id).then(() => {
			// Destroying the session
			res.redirect("/logout");

			// Removing entities owned by user
			stores.forEach((store, key) => {
				if (key !== "users") {
					cache(user.id, key).then(recs => {
						collections.remove(user.id + "_" + key);
						store.batch("del", recs.map(i => {
							return i.id;
						}));
					});
				}
			});
		}, e => {
			error(req, res, e);
		});
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		data = clone(user);
		delete data.active;
		delete data.id;
		delete data.password;
		delete data.verified;
		res.send(data);
	} else {
		data = load("users", req.body);
		next = () => {
			if (method === "PATCH" && array.cast(data).length === 0) {
				res.error(400, config.error.invalid_arguments);
			} else if (method === "PUT" && (data.firstname === undefined || data.lastname === undefined || data.email === undefined || !regex.firstname.test(data.firstname) || !regex.lastname.test(data.lastname) || !regex.email.test(data.email))) {
				res.error(400, config.error.invalid_arguments);
			} else {
				stores.get("users").set(user.id, data, false, method === "PUT").then(rec => {
					req.session.passport.user = clone(rec[1]);
					res.send(config.instruction.success);
				}, e => {
					error(req, res, e);
				});
			}
		};

		if (data.password === undefined) {
			next();
		} else if (regex.password.test(data.password) && req.body.old_password !== undefined && regex.password.test(req.body.old_password)) {
			passwordCompare(req.body.old_password, user.password, (e, match) => {
				if (e) {
					res.error(400, config.error.invalid_arguments);
				} else if (match) {
					passwordCreate(data.password, (err, hash) => {
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
