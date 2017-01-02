'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks
const errors = require('feathers-errors')
const ObjectId = require('mongodb').ObjectID
const jwt = require('jsonwebtoken')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const app = feathers().configure(configuration(__dirname))

const restrictPrivate = function (options) {
  return function (hook) {
    return globalHooks.connection.then(db => {
      const collection = db.collection('playlists')

      let objId = ObjectId(hook.id)

      return new Promise((resolve, reject) => {
        collection.findOne({ _id: objId }, function (err, doc) {
          if (err) {
            return reject(err)
          }

          if (!doc) {
            return reject(new errors.NotFound('Playlist does not exist'))
          }

          if (!doc.public) {
            return reject(new errors.BadRequest('This playlist is not public!'))
          }

          return resolve(hook)
        })
      })
    })
  }
}

const checkNotExisting = function (options) {
  return function (hook) {
    return globalHooks.connection.then(db => {
      const collection = db.collection('playlists')

      let token = jwt.verify(hook.params.token, app.get('auth').token.secret)

      let searchQuery = {}
      searchQuery.user_ref = ObjectId(token._id)
      searchQuery.name = hook.data.name

      return new Promise((resolve, reject) => {
        collection.findOne(searchQuery, function (err, doc) {
          if (err) {
            return reject(err)
          }

          if (doc) {
            return reject(new errors.BadRequest('You already have a playlist with this name', { name: hook.data.name }))
          }

          return resolve(hook)
        })
      })
    })
  }
}

const excludePrivate = function (options) {
  return function (hook) {
    hook.params.query.public = true
    return hook
  }
}

const includeSchema = {
  include: [
    {
      service: 'users',
      nameAs: 'user',
      parentField: 'user_ref',
      childField: '_id',
      query: {
        $select: ['_id', 'email']
      }
    },
    {
      service: 'tracks',
      nameAs: 'tracks',
      parentField: 'tracks_ref',
      childField: '_id',
      query: {
        $select: ['_id', 'title']
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
    hooks.removeQuery('user', 'tracks')
  ],
  find: [excludePrivate()],
  get: [restrictPrivate()],
  create: [checkNotExisting()],
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
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      '__v',
      'user_ref',
      'tracks_ref',
      'createdAt',
      'updatedAt'),
    hooks.iff(globalHooks.isEmpty('user'), hooks.remove('user')),
    hooks.iff(globalHooks.isEmpty('tracks'), hooks.remove('tracks'))
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}

