# node-promise-retry [![Build Status](https://travis-ci.org/IndigoUnited/node-promise-retry.svg?branch=master)](https://travis-ci.org/IndigoUnited/node-promise-retry)

Retries a function that returns a promise, leveraging the power of the [retry](https://github.com/tim-kos/node-retry) module.

There's already some modules that are able to retry functions that return promises but
they were rather difficult to use or do not offer an easy to do conditional retries.


## Installation

`$ npm install promise-retry`


## Usage

### promiseRetry(fn, [options])

Calls `fn` until the returned promise is fulfilled or rejected with an error different than
a `retry` error.   
The `options` argument is an object which maps to the [retry](https://github.com/tim-kos/node-retry) module options:

- `retries`: The maximum amount of times to retry the operation. Default is `10`.
- `factor`: The exponential factor to use. Default is `2`.
- `minTimeout`: The number of milliseconds before starting the first retry. Default is `1000`.
- `maxTimeout`: The maximum number of milliseconds between two retries. Default is `Infinity`.
- `randomize`: Randomizes the timeouts by multiplying with a factor between `1` to `2`. Default is `false`.


```js
var promiseRetry = require('promise-retry');

promiseRetry(function (retry) {
    return doSomething()
    .then(null, function (err) {
        if (err.code === 'ETIMEDOUT') {
            // Will throw a retry error that will cause the function
            // to be called again or will throw the actual error if there's
            // no retries left
            throw retry(err)
        } else {
            throw err;
        }
    });
})
.then(function (value) {
    // ..
}, function (err) {
    // ..
});
```


## Tests

`$ npm test`


## License

Released under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
