'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks')
const auth = require('feathers-authentication').hooks

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [],
  create: [
    globalHooks.checkYear()
  ],
  update: [
    globalHooks.checkYear(),
    globalHooks.updateDate()
  ],
  patch: [
    globalHooks.checkYear(),
    globalHooks.updateDate()
  ],
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
