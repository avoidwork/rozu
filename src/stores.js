/**
 * DataStores with persistent storage in MongoDB
 *
 * @type Object
 */
var stores = {
	webhooks: store( null, merge( { id: "webhooks", index: [ "user_id", "host" ] }, config.defaults.store ) ),
	users: store( null, merge( { id: "users", index: [ "email" ] }, config.defaults.store ) ),
	verify: store( null, merge( { id: "verify", index: ["user_id"] }, config.defaults.store ) )
};
