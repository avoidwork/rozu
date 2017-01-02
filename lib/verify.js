"use strict";

const path = require("path"),
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
		rec = verifyStore.get(id, true),
		data = rec ? users.get(rec.user_id, true) : null;

	if (data) {
		// Changing record shape
		data.verified = true;
		delete data.verify_id;

		// Overwriting record to remove the 'verified_id' property
		users.set(rec.user_id, data, false, true).then(() => {
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
