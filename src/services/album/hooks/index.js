'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

const includeSchema = {
  include: [
    {
      service: 'artists',
      nameAs: 'artist',
      parentField: 'artist_ref',
      childField: '_id',
      query: {
        $select: ['_id', 'name']
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
    globalHooks.searchRegex(),
    hooks.removeQuery('artist', 'tracks')
  ],
  find: [],
  get: [],
  create: [
    globalHooks.checkYear()
  ],
  update: [
    globalHooks.checkYear(),
    globalHooks.updateDate()
  ],
  patch: [
    globalHooks.checkYear(),
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
      'createdAt',
      'updatedAt',
      '__v',
      'artist_ref',
      'tracks_ref'),
    hooks.iff(globalHooks.isEmpty('tracks'), hooks.remove('tracks')),
    hooks.iff(globalHooks.isEmpty('artist'), hooks.remove('artist'))
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}
