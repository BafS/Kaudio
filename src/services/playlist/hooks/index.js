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

/**
 * Restrict private playlists from GET
 */
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

          // If this playlist is not public and the request is not from the owner
          if (!doc.public && jwt.verify(hook.params.token, app.get('auth').token.secret)._id.toString() !== doc.user_ref.toString()) {
            return reject(new errors.BadRequest('This playlist is not public!'))
          }

          return resolve(hook)
        })
      })
    })
  }
}

/**
 * Check that the current user does not already have a playlist with this name
 */
const checkNotExisting = function (options) {
  return function (hook) {
    return globalHooks.connection.then(db => {
      const collection = db.collection('playlists')

      // Manual token verification is done to be able to get identity of user
      // as well as authentify them
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

/**
 * Hide private playlists from FIND
 */
const excludePrivate = function (options) {
  return function (hook) {
    hook.params.query.public = true
    return hook
  }
}

/**
 * Add the user ref for newly created playlists
 */
const addUserRef = function (options) {
  return function (hook) {
    let token = jwt.verify(hook.params.token, app.get('auth').token.secret)
    hook.data.user_ref = token._id
    return hook
  }
}

/**
 * Allows a patch on tracks_ref array with just one element to add or remove
 * for more info: http://jsonpatch.com
 */
const jsonPatch = function (options) {
  return function (hook) {
    if (hook.data.path === '/tracks_ref') {
      return globalHooks.connection.then(db => {
        const collection = db.collection('playlists')
        let id, ref
        try {
          id = new ObjectId(hook.id)
          ref = new ObjectId(hook.data.value)
        } catch (err) {
          return Promise.reject(new errors.BadRequest('Id is not valid!'))
        }
        switch (hook.data.op) {
          case 'add':
            collection.findOneAndUpdate({ _id: id }, { '$push': { 'tracks_ref': ref } }, { new: true }, function (err, doc) {
              if (err) {
                throw err
              }
            })
            break
          case 'remove':
            collection.findOneAndUpdate({ _id: id }, { '$pull': { 'tracks_ref': ref } }, { new: true }, function (err, doc) {
              if (err) {
                throw err
              }
            })
            break
          default:
            return Promise.reject(new errors.BadRequest('op: ' + hook.data.op + ' unknown'))
        }
      })
    }
  }
}

/**
 * Add users, tracks, albums and artists
 * so a single request from front end is needed
 */
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
        $select: ['_id', 'title', 'album_ref']
      },
      asArray: true,
      include: [
        {
          service: 'albums',
          nameAs: 'album',
          parentField: 'album_ref',
          childField: '_id',
          query: {
            $select: ['_id', 'title', 'artist_ref']
          },
          include: [
            {
              service: 'artists',
              nameAs: 'artist',
              parentField: 'artist_ref',
              childField: '_id',
              query: {
                $select: ['_id', 'name']
              }
            }
          ]
        }
      ]
    }
  ]
}

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    globalHooks.searchRegex(),
    hooks.removeQuery('user', 'tracks')
  ],
  find: [
    excludePrivate()
  ],
  get: [
    restrictPrivate()
  ],
  create: [
    checkNotExisting(),
    addUserRef()
  ],
  update: [
    hooks.setUpdatedAt('updatedAt')
  ],
  patch: [
    jsonPatch(),
    hooks.setUpdatedAt('updatedAt')
  ],
  remove: []
}

exports.after = {
  all: [],
  find: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      '__v',
      'user_ref',
      'tracks_ref',
      'createdAt',
      'updatedAt')
  ],
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

