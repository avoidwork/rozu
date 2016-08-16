/**
 * DataStores with persistent storage in MongoDB
 *
 * @type Object
 */
let stores = {
	webhooks: haro(null, merge(config.defaults.store, {id: "webhooks", index: ["user_id", "host", "name"]})),
	users: haro(null, merge(config.defaults.store, {id: "users", index: ["email", "active|email|verified"]})),
	verify: haro(null, merge(config.defaults.store, {id: "verify", index: ["user_id"]}))
};
