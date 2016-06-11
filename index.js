'use strict';

var errcode = require('err-code');
var retry = require('retry');

var hasOwn = Object.prototype.hasOwnProperty;

var PromiseProvider = Promise;

function isRetryError(err) {
    return err && err.code === 'EPROMISERETRY' && hasOwn.call(err, 'retried');
}

function promiseRetry(fn, options) {
    var temp;
    var operation;

    if (typeof fn === 'object' && typeof options === 'function') {
        // Swap options and fn when using alternate signature (options, fn)
        temp = options;
        options = fn;
        fn = temp;
    }

    operation = retry.operation(options);

    return new PromiseProvider(function (resolve, reject) {
        operation.attempt(function (number) {
            PromiseProvider.resolve()
            .then(function () {
                return fn(function (err) {
                    if (isRetryError(err)) {
                        err = err.retried;
                    }

                    throw errcode('Retrying', 'EPROMISERETRY', { retried: err });
                }, number);
            })
            .then(resolve, function (err) {
                if (isRetryError(err)) {
                    err = err.retried;

                    if (operation.retry(err || new Error())) {
                        return;
                    }
                }

                reject(err);
            });
        });
    });
}

function setPromiseProvider(newPromiseProvider) {
    if (typeof newPromiseProvider !== 'function') {
        throw new Error('PromiseProvider must be a function.');
    }
    if (typeof newPromiseProvider.resolve !== 'function') {
        throw new Error('PromiseProvider does not have a resolve method.');
    }
    PromiseProvider = newPromiseProvider;
}

promiseRetry.setPromiseProvider = setPromiseProvider;

module.exports = promiseRetry;
