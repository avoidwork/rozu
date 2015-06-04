/**
 * Loads data from an Object
 *
 * @method load
 * @param  {String} type Type of Object
 * @param  {Object} obj  Object to load
 * @return {Object}      Validated shape
 */
function load ( type, obj ) {
	var result = {};

	array.iterate( config.valid[ type ] || [], function ( i ) {
		if ( obj[ i ] !== undefined ) {
			result[ i ] = obj[ i ];
		}
	} );

	return result;
}
