/**
 * User handler
 *
 * @method user
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function user (req, res) {
	let admin = req.session.admin,
		id = req.url.replace(/.*\//, ""),
		obj, output;

	if (!admin) {
		return res.error(403);
	}

	obj = stores.users.get(id);

	if (obj) {
		if (req.method === "DELETE") {
			stores.users.del(obj[0]).then(function () {
				res.respond(config.instruction.success);
			}, function (e) {
				res.error(500, e);
				log(e, "error");
			});
		} else {
			output = clone(obj[1]);
			delete output.password;
			res.respond(output);
		}
	} else {
		res.error(404);
	}
}
