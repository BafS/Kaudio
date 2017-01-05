'use strict'

const auth = require('feathers-authentication').hooks

/**
 * Get results from tracks, albums, artists and playlists
 * services and return them. This avoids having to call
 * the server multiple times from the front end
 */
const callInternalServices = function (app) {
  return function (hook, next) {
    hook.result = {}
    hook.result.tracks = []
    hook.result.albums = []
    hook.result.artists = []
    hook.result.playlists = []

    const searchWord = hook.id

    app.service('tracks').find({ query: { title: { $search: searchWord } } })
      .then(function (res) {
        hook.result.tracks = res.data
      })
      .then(function (res) {
        return app.service('albums').find({ query: { title: { $search: searchWord } } })
      })
      .then(function (res) {
        hook.result.albums = res.data
      })
      .then(function (res) {
        return app.service('artists').find({ query: { name: { $search: searchWord } } })
      })
      .then(function (res) {
        hook.result.artists = res.data
      })
      .then(function (res) {
        return app.service('playlists').find({ query: { name: { $search: searchWord }, public: true } })
      })
      .then(function (res) {
        hook.result.playlists = res.data
      })
      .then(function (res) {
        next()
      })
      .catch(function (err) {
        console.log(err)
      })
  }
}

exports.before = function (app) {
  return {
    all: [
      auth.verifyToken(),
      auth.populateUser(),
      auth.restrictToAuthenticated()
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}

exports.after = function (app) {
  return {
    all: [],
    find: [],
    get: [
      callInternalServices(app)
    ],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
}
