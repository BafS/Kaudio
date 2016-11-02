'use strict'

// Add any common hooks you want to share across services in here.
//
// Below is an example of how a hook is written and exported. Please
// see http://docs.feathersjs.com/hooks/readme.html for more details
// on hooks.

// https://github.com/feathersjs/feathers-hooks-common

// exports.myHook = function (options) {
//   return function (hook) {
//     console.log('My custom global hook ran.')
//   }
// }

const defaults = {}

exports.updateDate = function (options) {
  return function (hook) {
    hook.data.updatedAt = new Date()
  }
}

exports.checkYear = function (options) {
  options = Object.assign({}, defaults, options)
  const errors = require('feathers-errors')
  const MIN_YEAR = 1700
  const CUR_YEAR = new Date().getFullYear()
  const errorMessage = 'year must be between ' + MIN_YEAR + ' and ' + CUR_YEAR

  return function (hook) {
    if (hook.data.year < MIN_YEAR || hook.data.year > CUR_YEAR) {
      throw new errors.BadRequest(`Invalid request`, {
        errors: [
          {
            path: 'year',
            value: hook.data.year,
            message: errorMessage
          }
        ]
      })
    }
  }
}
