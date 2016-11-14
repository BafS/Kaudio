'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [],
  create: [],
  update: [
    globalHooks.updateDate()
  ],
  patch: [
    globalHooks.updateDate()
  ],
  remove: []
}

exports.after = {
  all: [],
  find: [],
  get: [
    hooks.populate('user', {
      service: 'users',
      field: 'user_ref'
    }),
    hooks.populate('tracks', {
      service: 'tracks',
      field: 'tracks_ref'
    }),
    hooks.remove(
      '__v',
      'user_ref',
      'tracks_ref',
      'createdAt',
      'updatedAt')
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}

