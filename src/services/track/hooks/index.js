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
    hooks.populate('album', {
      service: 'albums',
      field: 'album_ref'
    }),
    hooks.populate('aOAlbums', {
      service: 'albums',
      field: 'aOAlbums_ref'
    }),
    hooks.remove(
      'updatedAt',
      'createdAt',
      '__v',
      'album_ref',
      'album.tracks_ref',
      'album.year',
      'album.artist.persons_ref',
      'album.artist.aOAlbums_ref',
      'album.artist.origin',
      'album.artist.year',
      'aOAlbums_ref',
      'aOAlbums.tracks_ref',
      'aOAlbums.year',
      'aOAlbums.artist.persons_ref',
      'aOAlbums.artist.aOAlbums_ref',
      'aOAlbums.artist.origin',
      'aOAlbums.artist.year')
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}
