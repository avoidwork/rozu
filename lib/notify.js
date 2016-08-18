"use strict";

const deferred = require("tiny-defer"),
	path = require("path"),
	config = require(path.join(__dirname, "..", "config.js")),
	clone = require(path.join(__dirname, "clone.js")),
	mta = require(path.join(__dirname, "mta.js"));

/**
 * Sends a notification
 *
 * @method notify
 * @param  {String} type     Type of notice to send, defaults to 'email'
 * @param  {Object} data     Data describing the recipient (user record)
 * @param  {String} template Message template
 * @return {Object}          Promise
 */
function notify (type, data, template, uri) {
	let defer = deferred(),
		keys, text, html;

	if (type === "email") {
		text = clone(template.text);
		html = clone(template.html);
		keys = text.match(/({{.*}})/g);

		keys.forEach(i => {
			let r = new RegExp(i, "g"),
				k, v;

			if (i !== "{{verify}}") {
				k = i.replace(/{{|}}/g, "");
				v = data[k];
			} else {
				v = uri + "/verify/" + data.verify_id;
			}

			text = text.replace(r, v);
			html = html.replace(r, v);
		});

		if (mta) {
			mta.sendMail({
				from: config.email.from,
				to: data.email,
				subject: template.subject,
				text: text,
				html: html
			}, (e, info) => {
				if (e) {
					defer.reject(e);
				} else {
					defer.resolve(info.response);
				}
			});
		} else {
			defer.resolve(true);
		}
	} else {
		defer.reject(false);
	}

	return defer.promise;
}

module.exports = notify;
