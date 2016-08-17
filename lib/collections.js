"use strict";

const lru = require("tiny-lru"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.json")),
	collections = lru(config.collection || 50);

module.exports = collections;
