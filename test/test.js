'use strict';

var expect = require('expect.js');
var Promise = require('bluebird');
var promiseRetry = require('../');

describe('promise-retry', function () {
    it('should retry if retry was called', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            return Promise.delay(10)
            .then(function () {
                if (count < 2) {
                    count += 1;
                    retry(new Error('foo'));
                }

                return 'final';
            });
        }, { factor: 1 })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(2);
        })
        .done(done, done);
    });

    it('should not retry if retry was not called', function (done) {
        var count = 0;

        promiseRetry(function () {
            return Promise.delay(10)
            .thenReturn('final');
        })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(0);
        })
        .done(done, done);
    });

    it('should reject the promise if the retries were exceeded', function (done) {
        promiseRetry(function () {
            return Promise.delay(10)
            .thenThrow(new Error('foo'));
        }, { retries: 1, factor: 1 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
        })
        .done(done, done);
    });

    it('should pass options to the underlying retry module', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            return Promise.delay(10)
            .then(function () {
                if (count < 2) {
                    count += 1;
                    retry(new Error('foo'));
                }

                return 'final';
            });
        }, { retries: 1, factor: 1 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
        })
        .done(done, done);
    });

    it('should convert values into promises', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            if (count < 2) {
                count += 1;
                retry(new Error('foo'));
            }

            return 'final';
        }, { factor: 1 })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(2);
        })
        .done(done, done);
    });

    it('should convert errors into promises', function (done) {
        promiseRetry(function () {
            throw new Error('foo');
        }, { retries: 1, factor: 1 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
        })
        .done(done, done);
    });

    it('should not fail on undefined rejections', function (done) {
        promiseRetry(function () {
            throw undefined;
        }, { retries: 1, factor: 1 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err).to.be(undefined);
        })
        .then(function () {
            return promiseRetry(function (retry) {
                retry();
            }, { retries: 1, factor: 1 });
        })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err).to.be(undefined);
        })
        .done(done, done);
    });

    it('should work with several retries in the same chain', function (done) {
        promiseRetry(function (retry) {
            return Promise.delay(10)
            .then(function () {
                retry(new Error('foo'));
            })
            .catch(function (err) {
                retry(err);
            });
        }, { retries: 1, factor: 1 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
        })
        .done(done, done);
    });
});
