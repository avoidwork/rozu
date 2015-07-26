/**
 * Returns a Deferred
 *
 * @method deferred
 * @return {Object} Deferred
 */
function deferred () {
    let promise, resolver, rejecter;

    promise = new Promise(function (resolve, reject) {
        resolver = resolve;
        rejecter = reject;
    });

    return {resolve: resolver, reject: rejecter, promise: promise};
}
