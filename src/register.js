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

		if (stores.users.indexes.email && stores.users.indexes.email[args.email] !== undefined) {
			res.error(400, config.error.email_used);
		} else if (args.firstname === undefined || args.lastname === undefined || args.email === undefined || args.password === undefined || !regex.firstname.test(args.firstname) || !regex.lastname.test(args.lastname) || !regex.email.test(args.email) || !regex.password.test(args.password)) {
			res.error(400, config.error.invalid_arguments);
		} else {
			new_user(args).then(function (arg) {
				res.respond({user_id: arg.user.key, instruction: config.instruction.verify});
				notify("email", stores.users.dump([arg.user])[0], config.template.email.verify, ((req.headers["x-forwarded-proto"] ? req.headers["x-forwarded-proto"] + ":" : req.parsed.protocol) + "//" + (req.headers["x-forwarded-protocol"] || req.parsed.host))).then(null, function (e) {
					log(e, "error");
				});
			}, function (e) {
				res.error(500, e.message || e);
				log(e, "error");
			});
		}
	} else {
		res.error(400, config.error.invalid_arguments);
	}
}
