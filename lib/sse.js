"use strict";

const SSE = require("express-sse"),
	sse = new SSE();

// @todo make a map for individual streams based on user_id

module.exports = sse;
