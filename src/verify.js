/**
 * Verify handler
 *
 * @method verify
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function verify (req, res) {
	let vid = req.url.replace(/.*\//, ""),
		vrec = stores.verify.get(vid),
		vuser = vrec ? stores.users.get(vrec[1].user_id) : null,
		luser;

	if (vuser) {
		luser = clone(vuser[1]);

		// Changing record shape
		luser.verified = true;
		delete luser.verify_id;

		// Overwriting record to remove the 'verified_id' property
		stores.users.set(vuser[0], luser, false, true).then(function () {
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
