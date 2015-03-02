'use strict';

var errcode = require('err-code');
var retry = require('retry');
var Promise = require('bluebird');
var hasOwn = Object.prototype.hasOwnProperty;

function isRetryError(err) {
    return err && err.code === 'EPROMISERETRY' && hasOwn.call(err, 'retried');
}

function promiseRetry(options, fn) {
    var temp;

    if (!fn && typeof(options) === 'function') {
        // options is optional
        fn = options;
        options = null;
    }

    if (typeof(fn) === 'object' && typeof(options) === 'function') {
        // swap options and fn when using old function signature of (fn, options)
        temp = options;
        options = fn;
        fn = temp;
    }

    var operation = retry.operation(options);

    return new Promise(function (resolve, reject) {
        operation.attempt(function (number) {
            var promise;

            promise = Promise.try(function () {
                return fn(function (err) {
                    if (isRetryError(err)) {
                        err = err.retried;
                    }

                    throw errcode('Retrying', 'EPROMISERETRY', {
                        retried: err
                    });
                }, number);
            });

            promise.done(resolve, function (err) {
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

module.exports = promiseRetry;
