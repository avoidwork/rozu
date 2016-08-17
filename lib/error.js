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
	res.error(500, e);
	req.server.log(e, "error");
	sse.send({type: "error", data: e.stack || e.message || e});
}

module.exports = error;
