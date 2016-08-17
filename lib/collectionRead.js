"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	cache = require(path.join(__dirname, "cache.js")),
	error = require(path.join(__dirname, "error.js"));

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
function collectionRead (req, res, id, type) {
	cache(id, type).then(data => {
		let instruction = config.instruction[type + "_create"];

		res.respond(data.length > 0 ? data : instruction ? {instruction: instruction} : data);
	}, e => {
		error(req, res, e);
	});
}

module.exports = collectionRead;
