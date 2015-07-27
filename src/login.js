/**
 * Login handler
 *
 * @method login
 * @param  {String} username Username
 * @param  {String} password Unencrypted password
 * @param  {String} callback Callback
 * @return {Undefined}       undefined
 */
function login (username, password, callback) {
	let recs = stores.users.find({email: username, active: true, verified: true}),
		luser;

	if (recs.length === 0) {
		callback(new Error(config.error.invalid_credentials), null);
	} else {
		// Rebuilding a mutable version of the record to pass around in the session
		luser = clone(recs[0][1]);
		luser.id = recs[0][0];

		password_compare(password, luser.password, function (e, match) {
			if (e) {
				callback(e, null);
			} else if (match) {
				callback(null, luser);
			} else {
				callback(new Error(config.error.invalid_credentials), null);
			}
		});
	}
}
