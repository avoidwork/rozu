/**
 * Creates a new user account
 *
 * @method new_user
 * @param  {Object} args User attributes
 * @return {Object}      Promise
 */
function new_user (args) {
	var defer = deferred();

	if (!args.password) {
		args.password = mpass();
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
				stores.verify.set(rec.data.verify_id, {user_id: rec.key}).then(function () {
					defer.resolve({user: rec, password: args.password});
				}, function (e) {
					defer.reject(e);
				});
			}, function (e) {
				defer.reject(e);
			});
		}
	});

	return defer.promise;
}
