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
for (var i = 0; i < 1000; i++) {
  keys.push(
    crypto.createHash('sha256')
      .update(Number(i).toString(36))
      .digest()
      .buffer
  )
}

var hasAll = new StrataEstimator(options)
keys.forEach(function (key) {
  hasAll.insert(key)
})

var hasHalf = new StrataEstimator(options)
keys.slice(500).forEach(function (key) {
  hasHalf.insert(key)
})

var decoded = hasAll.decode(hasHalf)

assert.equal(decoded, 500)
