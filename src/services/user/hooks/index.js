'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks
const ObjectId = require('mongodb').ObjectID

/**
 * Add friends so a single request from
 * front end is needed
 */
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

/**
 * Keep current password if password is
 * not given in a PUT from the front end
 * (i.e. user wished to keep the same password)
 */
const keepPassword = function (app) {
  return function (hook, next) {
    if (hook.data.password === undefined) {
      let id = new ObjectId(hook.id)
      app.service('users').get({ _id: id })
        .then(function (res) {
          hook.data.password = res.password
          console.log('data:' + JSON.stringify(hook.data, null, 2))
          next()
        })
        .catch(function (err) {
          throw err
        })
    } else {
      next()
    }
  }
}

exports.before = function (app) {
  return {
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
      hooks.setUpdatedAt('updatedAt'),
      keepPassword(app)
    ],
    patch: [
      auth.hashPassword(),
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      auth.restrictToOwner({ ownerField: '_id' }),
      globalHooks.jsonPatch('users'),
      hooks.setUpdatedAt('updatedAt')
    ],
    remove: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated(),
      auth.restrictToOwner({ ownerField: '_id' })
    ]
  }
}

exports.after = function (app) {
  return {
    all: [hooks.remove('password')],
    find: [
      hooks.populate({ schema: includeSchema }),
      hooks.remove(
        '__v',
        'updatedAt',
        'friends_ref')
    ],
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
}
