"use strict";

const path = require("path"),
	clone = require(path.join(__dirname, "clone.js")),
	error = require(path.join(__dirname, "error.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Verify handler
 *
 * @method verify
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function verify (req, res) {
	let id = req.url.replace(/.*\//, ""),
		verifyStore = stores.get("verify"),
		users = stores.get("users"),
		rec = verifyStore.get(id),
		user = rec ? users.get(rec[1].user_id) : null,
		luser;

	if (user) {
		luser = clone(user[1]);

		// Changing record shape
		luser.verified = true;
		delete luser.verify_id;

		// Overwriting record to remove the 'verified_id' property
		users.set(user[0], luser, false, true).then(() => {
			verifyStore.del(id);
			res.send({login_uri: "/login", "instruction": "Your account has been verified, please login"});
		}, e => {
			error(req, res, e);
		});
	} else {
		res.error(404);
	}
}

module.exports = verify;
