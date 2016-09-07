"use strict";

const jsonpatch = require("jsonpatch").apply_patch,
	path = require("path"),
	collectionDelete = require(path.join(__dirname, "collectionDelete.js")),
	collectionUpdate = require(path.join(__dirname, "collectionUpdate.js")),
	clone = require(path.join(__dirname, "clone.js")),
	iterate = require(path.join(__dirname, "iterate.js")),
	load = require(path.join(__dirname, "load.js")),
	regex = require(path.join(__dirname, "regex.js")),
	stores = require(path.join(__dirname, "stores.js"));

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
function collectionItem (req, res, type, fn, links) {
	const user = req.session.passport.user,
		id = req.body ? req.body[type.replace(regex.trailing_s, "") + "_id"] || req.url.replace(/.*\//, "") : req.url.replace(/.*\//, ""),
		method = req.method,
		admin = req.session.admin === true,
		rec = stores.get(type).get(id);

	let data, output;

	if (!rec || rec && rec[1].user_id !== user.id && !admin) {
		res.error(404);
	} else if (method === "DELETE") {
		collectionDelete(req, res, user.id, type, id);
	} else if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
		output = clone(rec[1]);

		if (!admin) {
			delete output.user_id;
		}

		if (links !== undefined) {
			iterate(links, (v, k) => {
				output[k] = v.replace(/:id/g, id);
			});
		}

		res.send(output);
	} else {
		if (method === "PATCH") {
			try {
				data = jsonpatch(clone(rec[1]), req.body);
			} catch (e) {
				return res.error(400, e);
			}

			data = load(type, data);
		} else {
			data = load(type, req.body);
		}

		data.user_id = user.id;

		fn(data, e => {
			if (e) {
				res.error(400, e);
			} else {
				collectionUpdate(req, res, user.id, type, id, data);
			}
		}, method);
	}

	return void 0;
}

module.exports = collectionItem;
