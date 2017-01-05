'use strict'

const globalHooks = require('../../../hooks')
const auth = require('feathers-authentication').hooks

const addTokenToHeaders = function (options) {
  return function (hook) {
    if (hook.params.query.authorization !== undefined) {
      hook.params.token = hook.params.query.authorization
    }

    if (hook.params.query.Authorization !== undefined) {
      hook.params.token = hook.params.query.Authorization
    }
  }
}

exports.before = {
  all: [
    addTokenToHeaders(),
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [
    globalHooks.replaceId('tracks', 'file')
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [],
  update: [],
  patch: [],
  remove: []
}
