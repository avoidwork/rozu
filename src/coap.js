function coap (req, res, coapServer, tensoServer) {
	let method = req.method,
		json = "application/json",
		header = {"Content-Format": json};

	if (method === "POST") {
			res.code = "2.01";
			res.end();
	} else if (method === "GET") {
		if (req.headers.Accept !== json) {
			res.code = "4.06";
			res.end();
		} else {
			res.writeHead("2.05", header);
			res.send(tensoServer.serialize(undefined, {instruction: config.instruction.receive}));
		}
	} else {
		res.code = "4.05";
		res.end();
	}
}
