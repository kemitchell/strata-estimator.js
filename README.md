Invertible Bloom Filter-based strata set difference estimator
as described by Eppstein et al. in
[_What's the Difference? Efficient Set Reconciliation without Prior Context_][1].

[1]: https://www.ics.uci.edu/~eppstein/pubs/EppGooUye-SIGCOMM-11.pdf

Depends only on [ibf].

[ibf]: https://npmjs.com/packages/ibf

[standard] style.

[standard]: https://npmjs.com/packages/standard

```javascript
var StrataEstimator = require('strata-estimator')

// This code in this `README` is runs as a test suite.
var assert = require('assert')

// A non-cryptographic hash function.
var xxh = require('xxhashjs').h32

// The number of cells per invertible bloom filter.
var cellCount = 80

// Seeds for the three distinct bloom filter hash functions.
var seeds = [0x0000, 0x9999, 0xFFFF]

var options = {
  // The hash to use to assign keys to strata.
  hash: function (input) { return xxh(input, 0xAAAA) },

  // The number of strata.
  strataCount: 32,

  // Options for each stratum's invertible bloom filter, passed to
  // the ibf package constructor.
  // See https://npmjs.com/packages/ibf
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

// Create some test keys.

var keys = []
for (var i = 0; i < 100; i++) {
  keys.push(
    require('crypto').createHash('sha256')
      .update(Number(i).toString(36))
      .digest()
      .buffer
  )
}

var has100 = new StrataEstimator(options)
keys.slice(0, 100).forEach(function (key) { has100.insert(key) })

// With or without `new`

var has25 = StrataEstimator(options)
keys.slice(0, 25).forEach(function (key) { has25.insert(key) })

var has50 = new StrataEstimator(options)
keys.slice(0, 50).forEach(function (key) { has50.insert(key) })

var has75 = StrataEstimator(options)
keys.slice(0, 75).forEach(function (key) { has75.insert(key) })

assert.equal(has100.decode(has100), 0)

var diff25 = has100.decode(has75)
assert(diff25 >= 25)
assert(diff25 <= 64)

var diff50 = has100.decode(has50)
assert(diff50 >= 50)
assert(diff50 <= 64)

var diff75 = has100.decode(has25)
assert(diff75 >= 75)
assert(diff75 <= 128)
```
