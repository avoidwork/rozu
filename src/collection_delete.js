/**
 * Collection deletion facade
 *
 * @method collection_delete
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} user User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @return {Undefined}   undefined
 */
function collection_delete (req, res, user_id, type, key) {
	collections.remove(user_id + "_" + type);
	stores[type].del(key).then(function () {
		res.respond(config.instruction.success);
	}, function (e) {
		res.error(500, e);
		log(e, "error");
	});
}
