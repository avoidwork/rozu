"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	error = require(path.join(__dirname, "error.js")),
	load = require(path.join(__dirname, "load.js")),
	newUser = require(path.join(__dirname, "newUser.js")),
	notify = require(path.join(__dirname, "newUser.js")),
	regex = require(path.join(__dirname, "regex.js")),
	stores = require(path.join(__dirname, "stores.js"));

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

		if (stores.get("users").indexes.get("email").has(args.email)) {
			res.error(400, config.error.email_used);
		} else if (typeof args.firstname !== "string" || typeof args.lastname !== "string" || typeof args.email !== "string" || typeof args.password !== "string" || !regex.firstname.test(args.firstname) || !regex.lastname.test(args.lastname) || !regex.email.test(args.email) || !regex.password.test(args.password)) {
			res.error(400, config.error.invalid_arguments);
		} else {
			newUser(args).then(arg => {
				res.send({user_id: arg.user[0], instruction: config.instruction.verify});
				notify("email", stores.get("users").toArray([arg.user])[0], config.templates.email.verify, (req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol) + "//" + (req.headers["x-forwarded-protocol"] || req.parsed.host));
			}, e => {
				error(req, res, e);
			});
		}
	} else {
		res.error(400, config.error.invalid_arguments);
	}
}

module.exports = register;
