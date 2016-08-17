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
function collection_update (req, res, luser, type, key, data, msg) {
	collections.remove(luser + "_" + type);

	stores[type].set(key, data, false, req.method === "PUT").then(function (rec) {
		let output = {
			instruction: (msg || config.instruction.success).replace(/\:id/g, rec[0])
		};

		if (!regex.invite.test(req.url)) {
			output.id = rec[0];
		}

		res.respond(output);
	}, function (e) {
		res.error(500, e);
		log(e, "error");
	});
}
