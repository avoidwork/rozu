"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	error = require(path.join(__dirname, "error.js")),
	load = require(path.join(__dirname, "load.js")),
	newUser = require(path.join(__dirname, "newUser.js")),
	notify = require(path.join(__dirname, "notify.js")),
	stores = require(path.join(__dirname, "stores.js")),
	validation = require(path.join(__dirname, "validation.js"));

/**
 * Registration handler
 *
 * @method register
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined}  undefined
 */
function register (req, res) {
	const users = stores.get("users");
	let data;

	if (req.isAuthenticated()) {
		res.error(400, config.error.already_authenticated);
	} else if (req.body !== undefined) {
		data = load("users", req.body);

		if (users.indexes.get("email").has(data.email)) {
			res.error(400, config.error.email_used);
		} else {
			validation.users(data, e => {
				if (e) {
					res.error(400, config.error.invalid_arguments);
				} else {
					newUser(data).then(rec => {
						res.send({user_id: rec.user[0], instruction: config.instruction.verify});
						notify("email", users.toArray([rec.user])[0], config.templates.email.verify, (req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol) + "//" + (req.headers["x-forwarded-protocol"] || req.parsed.host));
					}, err => {
						error(req, res, err);
					});
				}
			});
		}
	} else {
		res.error(400, config.error.invalid_arguments);
	}
}

module.exports = register;
