"use strict";

const fs = require("fs"),
	path = require("path"),
	merge = require("tiny-merge"),
	root = __dirname,
	cfg = require(path.join(root, "config.json")),
	clone = require(path.join(root, "lib", "clone.js")),
	rozu = require(path.join(root, "lib", "rozu.js"));

function factory (arg) {
	let hostname = arg ? arg.hostname || "localhost" : "localhost",
		hosts = {},
		config = arg ? merge(clone(cfg), arg) : clone(cfg),
		obj;

	if (!config.port) {
		console.error("Invalid configuration");
		process.exit(1);
	}

	hosts[hostname] = "www";
	config.root = root;
	config.hosts = hosts;
	config.default = hostname;
	config.template = fs.readFileSync(config.template || path.join(config.root, "template.html"), {encoding: "utf8"});
	obj = tenso(config);
	obj.hostname = hostname;
	utility.bootstrap(obj, config);
	obj.server.start(config);

	return obj;
}

module.exports = factory;