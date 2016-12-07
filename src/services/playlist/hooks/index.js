'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks
const errors = require('feathers-errors')
const ObjectId = require('mongodb').ObjectID

const checkPublic = function (options) {
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

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [checkPublic()],
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

