/**
 * Sends a notification
 *
 * @method notify
 * @param  {String} type     Type of notice to send, defaults to 'email'
 * @param  {Object} data     Data describing the recipient (user record)
 * @param  {String} template Message template
 */
function notify ( type, data, template, uri ) {
	var defer = deferred(),
		keys, text, html;

	if ( type === "email" ) {
		text = clone( template.text, true );
		html = clone( template.html, true );
		keys = text.match( /({{.*}})/g );

		array.each( keys, function ( i ) {
			var r = new RegExp( i, "g" ),
				k, v;

			if ( i !== "{{verify}}" ) {
				k = i.replace( /{{|}}/g, "" );
				v = data[ k ];
			}
			else {
				v = uri + "/verify/" + data.verify_id;
			}

			text = text.replace( r, v );
			html = html.replace( r, v );
		} );

		mta.sendMail( {
			from: config.email.from,
			to: data.email,
			subject: template.subject,
			text: text,
			html: html
		}, function ( e, info ) {
			if ( e ) {
				log( e, "error" );
				defer.reject( e );
			}
			else {
				defer.resolve( info.response );
			}
		} );
	}
	else {
		defer.reject( false );
	}

	return defer;
}
