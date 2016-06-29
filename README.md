```javascript
var StrataEstimator = require('./')
var TextDecoder = require('text-encoding').TextDecoder
var crypto = require('crypto')
var assert = require('assert')
var murmur = require('murmurhash').v3

var cellCount = 80

var options = {
  hash: numberMurmur,
  strataCount: 32,
  filters: {
    cellCount: cellCount,
    checkHash: binaryMurmur,
    keyHashes: [singleMurmur, doubleMurmur, tripleMurmur],
    countView: Int32Array,
    idSumElements: 8,
    idSumView: Uint32Array,
    hashSumElements: 1,
    hashSumView: Uint32Array
  }
}

function bufferToString (buffer) {
  return new TextDecoder('utf8').decode(new Uint8Array(buffer))
}

function numberMurmur (buffer) {
  var inputString = bufferToString(buffer)
  return murmur(inputString)
}

function binaryMurmur (buffer) {
  var inputString = bufferToString(buffer)
  var digestNumber = murmur(inputString)
  var digestBuffer = new ArrayBuffer(4)
  var digestView = new Uint32Array(digestBuffer)
  digestView[0] = digestNumber
  return digestBuffer
}

function singleMurmur (buffer) {
  return murmur(bufferToString(buffer)) % cellCount
}

function doubleMurmur (buffer) {
  return murmur(
    murmur(bufferToString(buffer)).toString()
  ) % cellCount
}

function tripleMurmur (buffer) {
  return murmur(
    murmur(
      murmur(bufferToString(buffer)).toString()
    ).toString()
  ) % cellCount
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
assert.equal(has100.decode(has75), 25)
assert.equal(has100.decode(has50), 50)
assert.equal(has100.decode(has25), 75)
```
