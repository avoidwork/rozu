/**
 * Creates a new user account
 *
 * @method new_user
 * @param  {Object} args User attributes
 * @return {Object}      Promise
 */
function new_user (args) {
	let defer = deferred();

	if (!args.password) {
		args.password = mpass(3, true);
	}

	password_create(args.password, function (e, hash) {
		if (e) {
			defer.reject(e);
		} else {
			stores.users.set(uuid(), {
				firstname: args.firstname || "",
				lastname: args.lastname || "",
				email: args.email,
				password: hash,
				active: true,
				verified: false,
				verify_id: uuid()
			}).then(function (rec) {
				stores.verify.set(rec[1].verify_id, {user_id: rec[0]}).then(function () {
					defer.resolve({user: rec, password: args.password});
				}, function (err) {
					defer.reject(err);
				});
			}, function (err) {
				defer.reject(err);
			});
		}
	});

	return defer.promise;
}
