"use strict";

const path = require("path"),
	config = require(path.join(__dirname, "..", "config.json"));

let mta = null;

if (config.email.host && config.email.host !== "smtp.host") {
	mta = nodemailer.createTransport({
		host: config.email.host,
		port: config.email.port,
		secure: config.email.secure,
		auth: {
			user: config.email.user,
			pass: config.email.pass
		}
	});
}

module.exports = mta;
