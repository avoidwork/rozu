/**
 * Collection item handler
 *
 * @method collection_item
 * @param  {Object}   req   Client request
 * @param  {Object}   res   Client response
 * @param  {String}   type  Collection type
 * @param  {Function} fn    [Optional] PATCH/PUT validation
 * @param  {Object}   links [Optional] Hash of links (HATEOAS)
 * @return {Undefined}      undefined
 */
function collection_item (req, res, type, fn, links) {
	let luser = req.session.passport.user,
		id = req.body ? req.body[type.replace(regex.trailing_s, "") + "_id"] || req.url.replace(/.*\//, "") : req.url.replace(/.*\//, ""),
		method = req.method,
		admin = req.session.admin === true,
		rec = stores[type].get(id),
		data, output;

	if (!rec || rec && rec[1].user_id !== luser.id && !admin) {
		return res.error(404);
	}

	if (method === "DELETE") {
		collection_delete(req, res, luser.id, type, id);
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		output = clone(rec[1]);

		if (!admin) {
			delete output.user_id;
		}

		if (links !== undefined) {
			iterate(links, function (v, k) {
				output[k] = v.replace(/:id/g, id);
			});
		}

		res.respond(output);
	} else {
		if (method === "PATCH") {
			try {
				data = jsonpatch(clone(rec[1]).output, req.body);
			} catch (e) {
				return res.error(400, e);
			}

			data = load(type, data);
		} else {
			data = load(type, req.body);
		}

		data.user_id = luser.id;

		fn(data, function (e) {
			if (e) {
				res.error(400, e);
			} else {
				collection_update(req, res, luser.id, type, id, data);
			}
		}, method);
	}
}
