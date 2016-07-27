var InvertibleBloomFilter = require('ibf')

module.exports = StrataEstimator

function StrataEstimator (options) {
  if (!(this instanceof StrataEstimator)) {
    return new StrataEstimator(options)
  }
  validateOptions(options)
  this._hash = options.hash
  var strataCount = this._strataCount = options.strataCount
  var filters = this._filters = options.filters
  if (options.strata) this._strata = options.strata
  else {
    this._strata = []
    for (var index = 0; index < strataCount; index++) {
      this._strata.push(new InvertibleBloomFilter(filters))
    }
  }
}

StrataEstimator.prototype.clone = function () {
  return new StrataEstimator({
    hash: this._hash,
    filters: this._filters,
    strataCount: this._strataCount,
    strata: this._strata.map(function (stratum) {
      return stratum.clone()
    })
  })
}

StrataEstimator.prototype.insert = function (id) {
  var index = trailingZeroes(id, this._hash)
  this.stratum(index).insert(id)
}

StrataEstimator.prototype.stratum = function (index) {
  return this._strata[index]
}

StrataEstimator.prototype.decode = function (theirEstimator) {
  /* istanbul ignore if */
  if (this._strataCount !== theirEstimator._strataCount) {
    throw new Error('Different strata counts')
  }
  var count = 0
  var i = this._strataCount - 1
  while (i--) {
    /* istanbul ignore if */
    if (i === -1) return estimate(i)
    var difference = this.stratum(i).clone()
    difference.subtract(theirEstimator.stratum(i))
    var decoded = difference.decode()
    if (!decoded) return estimate(i)
    count += decoded.additional.length
    count += decoded.missing.length
  }
  function estimate (i) {
    return Math.pow(2, i + 1) * count
  }
}

// Helpers

function trailingZeroes (key, hash) {
  var digest = hash(key)
  var binaryString = Number(digest).toString(2)
  var count = 0
  for (var index = binaryString.length - 1; index !== -1; index--) {
    if (binaryString[index] === '0') count++
    else return count
  }
}

// Validation

var optionValidations = {
  hash: isHash,
  strataCount: isPositiveInteger,
  filters: function (x) { return typeof x === 'object' },
  strata: optional(arrayOfBloomFilters)
}

function validateOptions (options) {
  Object.keys(optionValidations).forEach(function (option) {
    if (!optionValidations[option](options[option])) {
      throw new Error('Invalid ' + option)
    }
  })
}

function optional (predicate) {
  return function (option) {
    return option === undefined || predicate(option)
  }
}

function arrayOfBloomFilters (array) {
  return Array.isArray(array) && array.every(function (stratum) {
    return stratum instanceof InvertibleBloomFilter
  })
}

function isHash (hash) {
  return typeof hash === 'function'
}

function isPositiveInteger (n) {
  return Number.isInteger(n) && n > 0
}
