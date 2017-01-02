'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

const includeSchema = {
  include: [
    {
      service: 'users',
      nameAs: 'friends',
      parentField: 'friends_ref',
      childField: '_id',
      query: {
        $select: ['_id', 'email', 'name']
      },
      asArray: true
    }
  ]
}

exports.before = {
  all: [],
  find: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    globalHooks.searchRegex(),
    hooks.removeQuery('friends')
  ],
  get: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
    // auth.restrictToOwner({ ownerField: '_id' })
  ],
  create: [
    auth.hashPassword()
  ],
  update: [
    auth.hashPassword(),
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToOwner({ ownerField: '_id' }),
    globalHooks.updateDate()
  ],
  patch: [
    auth.hashPassword(),
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToOwner({ ownerField: '_id' }),
    globalHooks.updateDate()
  ],
  remove: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    auth.restrictToOwner({ ownerField: '_id' })
  ]
}

exports.after = {
  all: [hooks.remove('password')],
  find: [],
  get: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      '__v',
      'updatedAt',
      'friends_ref'),
    hooks.iff(globalHooks.isEmpty('friends'), hooks.remove('friends'))
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}
