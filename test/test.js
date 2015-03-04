'use strict';

var expect = require('expect.js');
var Promise = require('bluebird');
var promiseRetry = require('../');

describe('promise-retry', function () {
    it('should call fn again if retry was called', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            count += 1;

            return Promise.delay(10)
            .then(function () {
                if (count <= 2) {
                    retry(new Error('foo'));
                }

                return 'final';
            });
        }, { factor: 1 })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(3);
        }, function () {
            throw new Error('should not fail');
        })
        .done(done, done);
    });

    it('should call fn with the attempt number', function (done) {
        var count = 0;

        promiseRetry(function (retry, number) {
            count += 1;
            expect(count).to.equal(number);

            return Promise.delay(10)
            .then(function () {
                if (count <= 2) {
                    retry(new Error('foo'));
                }

                return 'final';
            });
        }, { factor: 1 })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(3);
        }, function () {
            throw new Error('should not fail');
        })
        .done(done, done);
    });

    it('should not retry on fulfillment if retry was not called', function (done) {
        var count = 0;

        promiseRetry(function () {
            count += 1;

            return Promise.delay(10)
            .thenReturn('final');
        })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(1);
        }, function () {
            throw new Error('should not fail');
        })
        .done(done, done);
    });

    it('should not retry on rejection if retry was not called', function (done) {
        var count = 0;

        promiseRetry(function () {
            count += 1;

            return Promise.delay(10)
            .thenThrow(new Error('foo'));
        })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
            expect(count).to.be(1);
        })
        .done(done, done);
    });

    it('should not retry on rejection if nr of retries is 0', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            count += 1;

            return Promise.delay(10)
            .thenThrow(new Error('foo'))
            .catch(retry);
        }, { retries : 0 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
            expect(count).to.be(1);
        })
        .done(done, done);
    });

    it('should reject the promise if the retries were exceeded', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            count += 1;

            return Promise.delay(10)
            .thenThrow(new Error('foo'))
            .catch(retry);
        }, { retries: 2, factor: 1 })
        .then(function () {
            throw new Error('should not succeed');
        }, function (err) {
            expect(err.message).to.be('foo');
            expect(count).to.be(3);
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

    it('should convert direct fulfillments into promises', function (done) {
        promiseRetry(function () {
            return 'final';
        }, { factor: 1 })
        .then(function (value) {
            expect(value).to.be('final');
        }, function () {
            throw new Error('should not fail');
        })
        .done(done, done);
    });

    it('should convert direct rejections into promises', function (done) {
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

    it('should not crash on undefined rejections', function (done) {
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

    it('should retry if retry() was called with undefined', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            count += 1;

            return Promise.delay(10)
            .then(function () {
                if (count <= 2) {
                    retry();
                }

                return 'final';
            });
        }, { factor: 1 })
        .then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(3);
        }, function () {
            throw new Error('should not fail');
        })
        .done(done, done);
    });

    it('should work with several retries in the same chain', function (done) {
        var count = 0;

        promiseRetry(function (retry) {
            count += 1;

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
            expect(count).to.be(2);
        })
        .done(done, done);
    });

    it('should allow options to be passed first', function (done) {
        var count = 0;

        promiseRetry({ factor: 1 }, function (retry) {
            count += 1;

            return Promise.delay(10)
                .then(function () {
                    if (count <= 2) {
                        retry(new Error('foo'));
                    }

                    return 'final';
                });
        }).then(function (value) {
            expect(value).to.be('final');
            expect(count).to.be(3);
        }, function () {
            throw new Error('should not fail');
        }).done(done, done);
    });
});
