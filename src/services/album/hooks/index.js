'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    globalHooks.searchRegex()
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
  get: [
    hooks.populate('artist', {
      service: 'artists',
      field: 'artist_ref'
    }),
    hooks.remove(
      'createdAt',
      'updatedAt',
      '__v',
      'artist_ref')],
  create: [],
  update: [],
  patch: [],
  remove: []
}
