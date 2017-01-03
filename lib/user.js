"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	cache = require(path.join(__dirname, "cache.js")),
	collections = require(path.join(__dirname, "collections.js")),
	clone = require(path.join(__dirname, "clone.js")),
	error = require(path.join(__dirname, "error.js")),
	stores = require(path.join(__dirname, "stores.js")),
	iterate = require(path.join(__dirname, "iterate.js")),
	redis = require(path.join(__dirname, "redis.js")),
	deferred = require("tiny-defer"),
	mpass = require("mpass"),
	uuid = require("uuid").v1,
	create = require(path.join(__dirname, "password.js")).create;

function del (id) {
	iterate(stores, (store, key) => {
		if (key !== "users") {
			cache(id, key).then(recs => {
				collections.remove(id + "_" + key);
				store.batch("del", recs.map(i => i.id));
			});
		}
	});

	redis.pub.publish(config.id + "_reload", JSON.stringify({pid: process.pid, store: "users"}, null, 0));
}

/**
 * User handler
 *
 * @method account
 * @param  {Object} req Client request
 * @param  {Object} res Client response
 * @return {Undefined} undefined
 */
function account (req, res) {
	const admin = req.session.admin,
		id = req.url.replace(/.*\//, ""),
		store = stores.get("users");

	let obj, output;

	if (!admin) {
		return res.error(403);
	}

	obj = store.get(id, true);

	if (obj) {
		if (req.method === "DELETE") {
			store.del(id).then(() => {
				del(id);
				res.send(config.instruction.success);
			}, e => {
				error(req, res, e);
			});
		} else {
			output = clone(obj[1]);
			delete output.password;
			res.send(output);
		}
	} else {
		res.error(404);
	}

	return void 0;
}

/**
 * Creates a new user account
 *
 * @method createUser
 * @param  {Object} args User attributes
 * @return {Object}      Promise
 */
function createUser (args) {
	let defer = deferred();

	if (!args.password) {
		args.password = mpass(3, true);
	}

	create(args.password, (e, hash) => {
		if (e) {
			defer.reject(e);
		} else {
			stores.get("users").set(uuid(), {
				firstname: args.firstname || "",
				lastname: args.lastname || "",
				email: args.email,
				password: hash,
				active: true,
				verified: false,
				verify_id: uuid()
			}).then(rec => {
				stores.get("verify").set(rec[1].verify_id, {user_id: rec[0]}).then(() => {
					redis.pub.publish(config.id + "_reload", JSON.stringify({pid: process.pid, store: "users"}, null, 0));
					redis.pub.publish(config.id + "_reload", JSON.stringify({pid: process.pid, store: "verify"}, null, 0));
					defer.resolve({user: rec, password: args.password});
				}, defer.reject);
			}, defer.reject);
		}
	});

	return defer.promise;
}

module.exports = {
	account: account,
	create: createUser,
	delete: del
};
