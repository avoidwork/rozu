/**
 * RegExp cache of common test patterns
 *
 * @type Object
 */
var regex = {
	email: /\w*@\w*/,
	extension: /\..*$/,
	firstname: /(\w*){1,}/,
	invite: /^\/invite/,
	lastname: /(\w*){2,}/,
	password: /[a-zA-Z0-9_-]{8,40}/,
	std_port: /^(80|443)$/,
	trailing_s: /s$/,
	trailing_slash: /\/$/,
	uri_collection: /.*\//
};
