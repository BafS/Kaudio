'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

/**
 * Add albums and artists so a single request from
 * front end is needed
 */
const includeSchema = {
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

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated(),
    globalHooks.searchRegex(),
    hooks.removeQuery('album')
  ],
  find: [],
  get: [],
  create: [],
  update: [
    hooks.setUpdatedAt('updatedAt')
  ],
  patch: [
    hooks.setUpdatedAt('updatedAt')
  ],
  remove: []
}

exports.after = {
  all: [],
  find: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      'updatedAt',
      'createdAt',
      '__v',
      'album_ref',
      'aOAlbums_ref'),

    // pluck is used due to errors with remove function on subdocuments
    hooks.pluck(
      'album.artist',
      'album._id',
      'album.title',
      '_id',
      'title',
      'file'
      )
  ],
  get: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      'updatedAt',
      'createdAt',
      '__v',
      'album_ref',
      'aOAlbums_ref'),

    // pluck is used due to errors with remove function on subdocuments
    hooks.pluck(
      'album.artist',
      'album._id',
      'album.title',
      '_id',
      'title',
      'file'
      ),
    hooks.iff(globalHooks.isEmpty('album'), hooks.remove('album'))
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}
