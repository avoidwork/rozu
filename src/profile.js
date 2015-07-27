/**
 * Profile handler
 *
 * @method profile
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function profile (req, res) {
	let luser = req.session.passport.user,
		method = req.method,
		data, next;

	if (method === "DELETE") {
		stores.users.del(luser.id).then(function () {
			// Destroying the session
			res.redirect("/logout");

			// Removing entities owned by user
			iterate(stores, function (store, key) {
				if (key !== "users") {
					cache(luser.id, key).then(function (recs) {
						collections.remove(luser.id + "_" + key);
						store.batch("del", recs.map(function (i) {
							return i.id;
						})).then(null, function (e) {
							log(e, "error");
						});
					}, function (e) {
						log(e, "error");
					});
				}
			});
		}, function (e) {
			res.error(500, e);
			log(e, "error");
		});
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		data = clone(luser);
		delete data.active;
		delete data.id;
		delete data.password;
		delete data.verified;
		res.respond(data);
	} else {
		data = load("users", req.body);
		next = function () {
			if (method === "PATCH" && array.cast(data).length === 0) {
				res.error(400, config.error.invalid_arguments);
			} else if (method === "PUT" && (data.firstname === undefined || data.lastname === undefined || data.email === undefined || !regex.firstname.test(data.firstname) || !regex.lastname.test(data.lastname) || !regex.email.test(data.email))) {
				res.error(400, config.error.invalid_arguments);
			} else {
				stores.users.set(luser.id, data, false, method === "PUT").then(function (rec) {
					req.session.passport.user = clone(rec[1]);
					res.respond(config.instruction.success);
				}, function (e) {
					res.error(500, e);
					log(e, "error");
				});
			}
		};

		if (data.password === undefined) {
			next();
		} else if (regex.password.test(data.password) && req.body.old_password !== undefined && regex.password.test(req.body.old_password)) {
			password_compare(req.body.old_password, luser.password, function (e, match) {
				if (e) {
					res.error(400, config.error.invalid_arguments);
				} else if (match) {
					password_create(data.password, function (err, hash) {
						if (err) {
							res.error(400, err.message || err);
						} else {
							data.password = hash;
							next();
						}
					});
				} else {
					res.error(400, config.error.invalid_arguments);
				}
			});
		} else {
			res.error(400, config.error.invalid_arguments);
		}
	}
}
