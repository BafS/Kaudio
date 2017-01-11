'use strict'

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const errors = require('feathers-errors')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const app = feathers().configure(configuration(__dirname))

/**
 * Returns a promise that create a DB connection if successful.
 */
exports.connection = new Promise((resolve, reject) => {
  MongoClient.connect(app.get('mongodb'), function (err, db) {
    if (err) {
      return reject(err)
    }
    resolve(db)
  })
})

/**
 * Possibility to perform a search on the given field
 * Eg: `/users?email[$search]=alice`
 */
exports.searchRegex = function () {
  return (hook) => {
    const query = hook.params.query

    for (let field in query) {
      if (query[field].$search && field.indexOf('$') === -1) {
        query[field] = { $regex: new RegExp(query[field].$search, 'i') }
      }
    }
  }
}

/**
 * Checks that the year entered in a year field has the proper
 * format (e.g. 2015) and not an other format such as UNIX time.
 */
exports.checkYear = function (options) {
  options = Object.assign({}, {}, options)
  const errors = require('feathers-errors')
  const MIN_YEAR = 1700
  const CUR_YEAR = new Date().getFullYear()
  const errorMessage = 'year must be between ' + MIN_YEAR + ' and ' + CUR_YEAR

  return function (hook) {
    if (hook.data.year < MIN_YEAR || hook.data.year > CUR_YEAR) {
      throw new errors.BadRequest(`Invalid request`, {
        errors: [
          {
            path: 'year',
            value: hook.data.year,
            message: errorMessage
          }
        ]
      })
    }
  }
}

/**
 * Translates an ID of an object in a given service to the
 * ID of the original object.
 * e.g. /audios/[trackId] will translate the trackId to the
 * correct audioId for the DB request on the audios collection.
 */
exports.replaceId = function (service, field) {
  return function (hook) {
    return exports.connection.then(db => {
      const collection = db.collection(service)
      let id = new ObjectId(hook.id)
      return new Promise((resolve, reject) => {
        collection.findOne({ _id: id }, function (err, doc) {
          if (err) {
            return reject(err)
          }

          // The registered ID was wrong or the file hase been deleted
          if (doc === null) {
            return reject(new errors.BadRequest('Yikes! This file doesn\'t seem to exist...'))
          }

          hook.id = doc[field]

          return resolve(hook)
        })
      })
    })
  }
}

/**
 * Returns a boolean indicating if a field is empty
 */
exports.isEmpty = function (field) {
  return function (hook) {
    return hook.result[field].length === 0
  }
}

/**
 * Allows a patch on tracks_ref array with just one element to add or remove
 * for more info: http://jsonpatch.com
 */
exports.jsonPatch = function (options) {
  return function (hook) {
    if (hook.data.path !== undefined && hook.data.op !== undefined && hook.data.value !== undefined) {
      return exports.connection.then(db => {
        const collection = db.collection(options)
        let id, ref, path, updateObj
        try {
          id = new ObjectId(hook.id)

          // if it's a _ref, replace value with ObjectId(value), else assign native value
          if (hook.data.path.split('_').length > 1 && (hook.data.path.split('_')[1] === 'ref')) {
            ref = new ObjectId(hook.data.value)
          } else {
            ref = hook.data.value
          }
          path = hook.data.path.split('/')[1]
          updateObj = {}
          updateObj[path] = ref
        } catch (err) {
          return Promise.reject(new errors.BadRequest('Id is not valid!'))
        }
        switch (hook.data.op) {
          case 'add':
            return new Promise((resolve, reject) => {
              collection.findOne({ _id: id }, function (err, doc) {
                if (err) {
                  throw err
                }

                if (doc === null) {
                  return reject(new errors.BadRequest('This playlist does not exist!'))
                }

                if (typeof doc[path] !== 'object') {
                  return reject(new errors.BadRequest('Add operation should only be used on array!'))
                }

                for (let i = 0; i < doc[path].length; ++i) {
                  if (doc[path][i].equals(ref)) {
                    return reject(new errors.BadRequest('This element is already present in ' + options + ' list.'))
                  }
                }

                collection.findOneAndUpdate({ _id: id }, { '$push': updateObj }, { new: true }, function (err1, doc1) {
                  if (err1) {
                    throw err1
                  }
                  return resolve()
                })
              })
            })
          case 'remove':
            collection.findOneAndUpdate({ _id: id }, { '$pull': updateObj }, { new: true }, function (err, doc) {
              if (err) {
                throw err
              }
            })
            break
          case 'replace':
            collection.findOneAndUpdate({ _id: id }, { '$set': updateObj }, { new: true }, function (err, doc) {
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
    return hook
  }
}
