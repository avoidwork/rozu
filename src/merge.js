/**
 * Returns a merged of cloned inputs
 *
 * @method merge
 * @param  {Mixed} a Input to merge
 * @param  {Mixed} b Input to merge
 * @return {Mixed}   Merged of cloned inputs
 */
function merge (a, b) {
	let c = a !== undefined ? clone(a) : a,
		d = b !== undefined ? clone(b) : b;

	if (c instanceof Object && b instanceof Object) {
		Object.keys(d).forEach(function (i) {
			if (c[i] instanceof Object && d[i] instanceof Object) {
				c[i] = merge(c[i], d[i]);
			} else if (c[i] instanceof Array && d[i] instanceof Array) {
				c[i] = c[i].concat(d[i]);
			} else {
				c[i] = d[i];
			}
		});
	} else if (c instanceof Array && d instanceof Array) {
		c = c.concat(d);
	} else {
		c = d;
	}

	return c;
}
