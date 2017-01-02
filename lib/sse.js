"use strict";

const SSE = require("express-sse"),
	sse = new SSE();

module.exports = sse;

/*
 "use strict";

 const SSE = require("express-sse"),
 	sse = new Map();

 function get (arg) {
 	if (!sse.has(arg)) {
 		sse.set(arg, new SSE());
 	}

 	return sse.get(arg);
 }

 module.exports = get;
 */
