"use strict";

const uuid = require("uuid").v1,
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	cache = require(path.join(__dirname, "cache.js")),
	error = require(path.join(__dirname, "error.js")),
	load = require(path.join(__dirname, "load.js")),
	stores = require(path.join(__dirname, "stores.js")),
	jsonpatch = require("jsonpatch").apply_patch,
	clone = require(path.join(__dirname, "clone.js")),
	iterate = require(path.join(__dirname, "iterate.js")),
	regex = require(path.join(__dirname, "regex.js")),
	collections = require(path.join(__dirname, "collections.js"));

/**
 * Collection delete handler
 *
 * @method collection_delete
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} user User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @return {Undefined}   undefined
 */
function del (req, res, user_id, type, key) {
	collections.remove(user_id + "_" + type);
	stores.get(type).del(key).then(() => {
		res.send(config.instruction.success);
	}, e => {
		error(req, res, e);
	});
}

/**
 * Collection update handler
 *
 * @method collection_update
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} luser User ID
 * @param  {String} type Collection type
 * @param  {String} key  Record key
 * @param  {Object} data Record data
 * @param  {Object} msg  [Optional] Instruction
 * @return {Undefined}   undefined
 */
function update (req, res, luser, type, key, data, msg) {
	collections.remove(luser + "_" + type);
	stores.get(type).set(key, data, false, req.method === "PUT").then(rec => {
		let output = {
			instruction: (msg || config.instruction.success).replace(/\:id/g, rec[0])
		};

		if (!regex.invite.test(req.url)) {
			output.id = rec[0];
		}

		res.send(output);
	}, e => {
		error(req, res, e);
	});
}

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
function item (req, res, type, fn, links) {
	const user = req.session.passport.user,
		id = req.body ? req.body[type.replace(regex.trailing_s, "") + "_id"] || req.url.replace(/.*\//, "") : req.url.replace(/.*\//, ""),
		method = req.method,
		admin = req.session.admin === true,
		rec = stores.get(type).get(id);

	let data, output;

	if (!rec || rec && rec[1].user_id !== user.id && !admin) {
		res.error(404);
	} else if (method === "DELETE") {
		del(req, res, user.id, type, id);
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
				update(req, res, user.id, type, id, data);
			}
		}, method);
	}

	return void 0;
}

/**
 * Reads a collection
 *
 * @method read
 * @param  {Object} req  Client request
 * @param  {Object} res  Client response
 * @param  {String} id   User ID
 * @param  {String} type Collection type
 * @return {Undefined}   undefined
 */
function read (req, res, id, type) {
	cache(id, type).then(data => {
		let instruction = config.instruction[type + "_create"];

		res.send(data.length > 0 ? data : instruction ? {instruction: instruction} : data);
	}, e => {
		error(req, res, e);
	});
}

/**
 * Collection handler
 *
 * @method all
 * @param  {Object}   req  Client request
 * @param  {Object}   res  Client response
 * @param  {String}   type Collection type
 * @param  {Function} fn   POST validation
 * @return {Undefined}     undefined
 */
function all (req, res, type, fn) {
	let id = req.session.passport.user.id,
		data, nid;

	if (req.method === "POST") {
		data = load(type, req.body);
		nid = uuid();
		data.id = nid;
		data.user_id = id;

		fn(data, e => {
			if (e) {
				res.error(400, e);
			} else {
				update(req, res, id, type, nid, data, config.instruction[type + "_new"]);
			}
		});
	} else if (req.session.admin) {
		res.send(stores.get(type).dump());
	} else {
		read(req, res, id, type);
	}
}

module.exports = {
	all: all,
	item: item
};
