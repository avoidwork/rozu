/**
 * Collection handler
 *
 * @method collection
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {String}   type Collection type
 * @param  {Function} fn   POST validation
 * @return {Undefined}     undefined
 */
function collection (req, res, type, fn) {
	let method = req.method,
		id = req.session.passport.user.id,
		data;

	if (method === "POST") {
		data = load(type, req.body);
		data.user_id = id;

		fn(data, function (e) {
			if (e) {
				res.error(400, e);
			} else {
				collection_update(req, res, id, type, uuid(), data, config.instruction[type + "_new"]);
			}
		});
	} else if (req.session.admin) {
		res.respond(stores[type].toArray(null, false));
	} else {
		collection_read(req, res, id, type);
	}
}
