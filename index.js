'use strict';

var errcode = require('err-code');
var retry = require('retry');
var Promise = require('bluebird');

function promiseRetry(fn, options) {
    var operation = retry.operation(options);

    return new Promise(function (resolve, reject) {
        operation.attempt(function () {
            var promise;
            var retried;

            promise = Promise.try(function () {
                return fn(function (err) {
                    retried = true;

                    if (operation.retry(err)) {
                        return errcode('Retrying', 'EPROMISERETRY');
                    }

                    return operation.mainError();
                });
            });

            promise.then(resolve, function (err) {
                if (!err || err.code !== 'EPROMISERETRY') {
                    reject(err);
                }
            });
        });
    });
}

module.exports = promiseRetry;
