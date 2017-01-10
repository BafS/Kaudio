'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

/**
 * Add artists so a single request from
 * front end is needed
 */
const includeSchema = {
  include: [
    {
      service: 'artists',
      nameAs: 'artists',
      parentField: 'artists_ref',
      childField: '_id',
      query: {
        $limit: 999,
        $select: ['_id', 'name']
      },
      asArray: true
    }
  ]
}

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    hooks.removeQuery('artists')
  ],
  find: [],
  get: [],
  create: [
    globalHooks.checkYear()
  ],
  update: [
    globalHooks.checkYear(),
    hooks.setUpdatedAt('updatedAt')
  ],
  patch: [
    globalHooks.checkYear(),
    hooks.setUpdatedAt('updatedAt')
  ],
  remove: []
}

exports.after = {
  all: [],
  find: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      'createdAt',
      'updatedAt',
      '__v',
      'artists_ref')
  ],
  get: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      'createdAt',
      'updatedAt',
      '__v',
      'artists_ref'),
    hooks.iff(globalHooks.isEmpty('artists'), hooks.remove('artists'))
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}
