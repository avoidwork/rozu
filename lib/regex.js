"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json"));

/**
 * RegExp cache of common test patterns
 *
 * @type Object
 */
const regex = {
	email: /\w*@\w*/,
	encoding: /form|json|querystring/,
	extension: /\..*$/,
	firstname: /(\w+){1,}/,
	invite: /^\/invite/,
	lastname: /(\w+){2,}/,
	password: new RegExp(config.password),
	payload: /string|object/,
	private: /private/,
	send: /_send$/,
	std_port: /^(80|443)$/,
	trailing_s: /s$/,
	trailing_slash: /\/$/,
	uri_collection: /.*\//
};

module.exports = regex;
