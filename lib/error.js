"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	redis = require(path.join(__dirname, "redis.js")),
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
	redis.pub.publish(config.id + "_sse", event);
}

module.exports = error;
