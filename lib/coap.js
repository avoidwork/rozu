"use strict";

const path = require("path"),
	receive = require(path.join(__dirname, "receive.js"));

function coap (req, res, coapServer, tensoServer) {
	let method = req.method,
		json = "application/json",
		header = {"Content-Format": json},
		invalidFormat = false,
		invalidSize = false,
		payload, output;

	if (method === "POST") {
		if (new Buffer(req.payload).byteLength >= tensoServer.server.config.maxBytes) {
			invalidSize = true;
		} else if (req.headers["Content-Format"] === json) {
			try {
				payload = JSON.parse(req.payload);
			} catch (e) {
				invalidFormat = true;
				tensoServer.server.log(e.stack, "debug");
			}
		} else {
			invalidFormat = true;
		}

		if (invalidSize) {
			res.code = "4.13";
		} else if (invalidFormat) {
			res.code = "4.15";
		} else {
			req.parsed = tensoServer.server.parse(req.url);
			res.code = receive(req, res, true, payload);
		}
	} else if (method === "GET") {
		if (req.headers.Accept !== json) {
			res.code = "4.06";
		} else {
			res.writeHead("2.05", header);
			output = tensoServer.serialize(undefined, {instruction: config.instruction.receive});
		}
	} else {
		res.code = "4.05";
	}

	res.end(output);
}

module.exports = coap;
