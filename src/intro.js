"use strict";

const path = require("path"),
	ROOT = path.join(__dirname, ".."),
	VERSION = "{{VERSION}}",
	SSE = require("express-sse"),
	Promise = require("es6-promise").Promise,
	array = require("retsu"),
	tenso = require("tenso"),
	bcrypt = require("bcrypt"),
	redis = require("redis"),
	nodemailer = require("nodemailer"),
	uuid = require("node-uuid").v1,
	mpass = require("mpass"),
	config = require(path.join(ROOT, "config.json")),
	jsonpatch = require("jsonpatch").apply_patch,
	request = require("request"),
	haro = require("haro"),
	haro_mongo = require("haro-mongo"),
	lru = require("tiny-lru");

let ROOT_ROUTES = [],
	collections = lru(config.collection || 1000),
	sse = new SSE(),
	app, mta, clientPublish, clientSubscribe;
