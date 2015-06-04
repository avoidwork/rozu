/**
 * Logs a message through tenso
 *
 * @param {Mixed}  arg   String or Error
 * @param {String} level [Optional] Log level, default is "info"
 */
function log ( arg, level ) {
	app.server.log( arg, level );
}
