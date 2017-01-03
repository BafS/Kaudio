'use strict'

const globalHooks = require('../../../hooks')
const hooks = require('feathers-hooks-common')
const auth = require('feathers-authentication').hooks

const includeSchema = {
  include: [
    {
      service: 'albums',
      nameAs: 'albums',
      parentField: 'albums_ref',
      childField: '_id',
      query: {
        $select: ['_id', 'title']
      },
      asArray: true
    },
    {
      service: 'albums',
      nameAs: 'aOAlbums',
      parentField: 'aOAlbums_ref',
      childField: '_id',
      query: {
        $select: ['_id', 'title']
      },
      asArray: true
    },
    {
      service: 'persons',
      nameAs: 'persons',
      parentField: 'persons_ref',
      childField: '_id',
      query: {
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
    globalHooks.searchRegex(),
    hooks.removeQuery('albums', 'aOAlbums', 'persons')
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
  find: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      'updatedAt',
      'createdAt',
      '__v',
      'albums_ref',
      'aOAlbums_ref',
      'persons_ref'
      )
  ],
  get: [
    hooks.populate({ schema: includeSchema }),
    hooks.remove(
      'updatedAt',
      'createdAt',
      '__v',
      'albums_ref',
      'aOAlbums_ref',
      'persons_ref'
      ),
    hooks.iff(globalHooks.isEmpty('albums'), hooks.remove('albums')),
    hooks.iff(globalHooks.isEmpty('aOAlbums'), hooks.remove('aOAlbums')),
    hooks.iff(globalHooks.isEmpty('persons'), hooks.remove('persons'))
  ],
  create: [],
  update: [],
  patch: [],
  remove: []
}
