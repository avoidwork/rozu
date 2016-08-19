const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	collections = require(path.join(__dirname, "collections.js")),
	error = require(path.join(__dirname, "error.js")),
	regex = require(path.join(__dirname, "regex.js")),
	stores = require(path.join(__dirname, "stores.js"));

/**
 * Collection update facade
 *
 * @method collection_update
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} luser User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @param  {Object} data Record data
 * @param  {Object} msg  [Optional] Instruction
 * @return {Undefined}   undefined
 */
function collectionUpdate (req, res, luser, type, key, data, msg) {
	collections.remove(luser + "_" + type);
	stores.get(type).set(key, data, false, req.method === "PUT").then(rec => {
		let output = {
			instruction: (msg || config.instruction.success).replace(/\:id/g, rec[0])
		};

		if (!regex.invite.test(req.url)) {
			output.id = rec[0];
		}

		res.send(output);
	}, e => {
		error(req, res, e);
	});
}

module.exports = collectionUpdate;
