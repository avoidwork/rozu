"use strict";

const path = require("path"),
	tenso = require("tenso"),
	config = require(path.join(__dirname, "config.json")),
	login = require(path.join(__dirname, "lib", "login.js")),
	rate = require(path.join(__dirname, "lib", "rate.js")),
	routes = require(path.join(__dirname, "lib", "routes.js"));

function factory () {
	config.auth.local.auth = login;
	config.rate.override = rate;
	config.routes = routes;

	return tenso(config);
}

module.exports = factory();
