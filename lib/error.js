"use strict";

const path = require("path"),
	sse = require(path.join(__dirname, "sse.js"));

/**
 * Generic error handler
 *
 * @method error
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @param  {Error}  e   Error
 * @return {Undefined}  undefined
 */
function error (req, res, e) {
	const event = {
			type: "error",
			data: e.stack || e.message || e
		},
		rec = req.session && req.session.passport && req.session.passport.user ? req.session.passport.user : null;

	res.error(500, e);
	req.server.log(e, "error");

	if (rec) {
		event.user_id = rec.id;
		sse(rec.id).send(event);
	}

	sse("admin").send(event);
}

module.exports = error;
