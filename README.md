Invertible Bloom Filter-based strata set difference size estimator
as described by Eppstein et al. in
[_What's the Difference? Efficient Set Reconciliation without Prior Context_][1].

[1]: https://www.ics.uci.edu/~eppstein/pubs/EppGooUye-SIGCOMM-11.pdf

The example in this `README` is run as the package's test suite.

```javascript
var StrataEstimator = require('./')
var crypto = require('crypto')
var assert = require('assert')
var xxh = require('xxhashjs').h32

var cellCount = 80

var seeds = [0x0000, 0x9999, 0xFFFF]

var options = {
  hash: function (input) {
    return xxh(input, 0xAAAA)
  },
  strataCount: 32,
  filters: {
    cellCount: cellCount,
    checkHash: function binaryXXH (idBuffer) {
      var digest = xxh(idBuffer, 0x1234)
      var digestBuffer = new ArrayBuffer(4)
      new Uint32Array(digestBuffer)[0] = digest
      return digestBuffer
    },
    keyHashes: seeds.map(function (seed) {
      return function (id) {
        return xxh(id, seed) % cellCount
      }
    }),
    countView: Int32Array,
    idSumElements: 8,
    idSumView: Uint32Array,
    hashSumElements: 1,
    hashSumView: Uint32Array
  }
}

var keys = []
for (var i = 0; i < 100; i++) {
  keys.push(
    crypto.createHash('sha256')
      .update(Number(i).toString(36))
      .digest()
      .buffer
  )
}

var has100 = new StrataEstimator(options)
keys.forEach(function (key) {
  has100.insert(key)
})

var has25 = new StrataEstimator(options)
keys.slice(0, 25).forEach(function (key) {
  has25.insert(key)
})

var has50 = new StrataEstimator(options)
keys.slice(0, 50).forEach(function (key) {
  has50.insert(key)
})

var has75 = new StrataEstimator(options)
keys.slice(0, 75).forEach(function (key) {
  has75.insert(key)
})

assert.equal(has100.decode(has100), 0)

var diff25 = has100.decode(has75)
assert(diff25 > 25)
assert(diff25 <= 64)

var diff50 = has100.decode(has50)
assert(diff50 > 50)
assert(diff50 <= 64)

var diff75 = has100.decode(has25)
assert(diff75 > 75)
assert(diff75 <= 128)
```
