/**
 * Verify handler
 *
 * @method verify
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function verify (req, res) {
	var vid = req.url.replace(/.*\//, ""),
		vrec = stores.verify.get(vid),
		user = vrec ? stores.users.get(vrec.data.user_id) : null;

	if (user) {
		// Changing record shape
		user.data.verified = true;
		delete user.data.verify_id;

		// Overwriting record to remove the 'verified_id' property
		stores.users.set(user.key, user.data, false, true).then(function () {
			stores.verify.del(vid).then(null, function (e) {
				log(e, "error");
			});
			res.respond({login_uri: "/login", "instruction": "Your account has been verified, please login"});
		}, function (e) {
			res.error(500, e.message || e);
			log(e, "error");
		});
	} else {
		res.error(404);
	}
}
