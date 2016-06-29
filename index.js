var IBF = require('ibf')

module.exports = StrataEstimator

function StrataEstimator (options) {
  if (!(this instanceof StrataEstimator)) {
    return new StrataEstimator(strataCount, filters)
  }
  validateOptions(options)
  this._hash = options.hash
  var strataCount = this._strataCount = options.strataCount
  var filters = this._filters = options.filters
  this._strata = []
  for (var index = 0; index < strataCount; index++) {
    this._strata.push(new IBF(filters))
  }
}

StrataEstimator.prototype.insert = function (id) {
  var index = trailingZeroes(id, this._hash)
  var stratum = this.stratum(index)
  stratum.insert(id)
}

StrataEstimator.prototype.stratum = function (index) {
  return this._strata[index]
}

StrataEstimator.prototype.decode = function (theirEstimator) {
  if (this._strataCount !== theirEstimator._strataCount) {
    throw new Error('Different strata counts')
  }
  var count = 0
  for (var i = this._strataCount - 1; i >= -1; i--) {
    if (i < 0) return estimate(i)
    var difference = this.stratum(i).clone()
    difference.subtract(theirEstimator.stratum(i))
    var decoded = difference.decode()
    if (!decoded) return estimate(i)
    count += decoded.additional.length
  }

  function estimate (i) {
    return Math.pow(2, i + 1) * count
  }
}

// Helpers

var ZEROES = /(0*)$/

function trailingZeroes (key, hash) {
  var digest = hash(key)
  var binaryString = Number(digest).toString(2)
  var match = ZEROES.exec(binaryString)
  return match[1].length
}

// Validation

var optionValidations = {
  hash: isHash,
  strataCount: isPositiveInteger,
  filters: function (x) {
    return typeof x === 'object'
  }
}

function validateOptions (options) {
  Object.keys(optionValidations).forEach(function (option) {
    if (!optionValidations[option](options[option])) {
      throw new Error('Invalid ' + option)
    }
  })
}

function isHash (hash) {
  return typeof hash === 'function'
}

function isPositiveInteger (n) {
  return Number.isInteger(n) && n > 0
}
