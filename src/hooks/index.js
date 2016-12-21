'use strict'

// Add any common hooks you want to share across services in here.
//
// Below is an example of how a hook is written and exported. Please
// see http://docs.feathersjs.com/hooks/readme.html for more details
// on hooks.

// https://github.com/feathersjs/feathers-hooks-common

// exports.myHook = function (options) {
//   return function (hook) {
//     console.log('My custom global hook ran.')
//   }
// }

const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectID
const errors = require('feathers-errors')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const app = feathers().configure(configuration(__dirname))

exports.connection = new Promise((resolve, reject) => {
  MongoClient.connect(app.get('mongodb'), function (err, db) {
    if (err) {
      return reject(err)
    }

    resolve(db)
  })
})

const defaults = {}

// Possibility to perform a search on the given field
// Eg: `/users?email[$search]=alice`
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

exports.updateDate = function (options) {
  return function (hook) {
    hook.data.updatedAt = new Date()
  }
}

exports.checkYear = function (options) {
  options = Object.assign({}, defaults, options)
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

exports.checkIfExists = function (options) {
  return function (hook) {
    let extensions = app.get(options)

    return exports.connection.then(db => {
      const audioCollection = db.collection('fs.files')

      let objId = new ObjectId(hook.id)

      return audioCollection.count({ _id: objId }).then(res => {
        if (res == 0) {
          throw new errors.BadRequest('Yikes! This file doesn\'t seem to exist...')
        }

        return new Promise((resolve, reject) => {
          audioCollection.find({ _id: objId }).toArray(function (err, docs) {
            if (err) {
              return reject(err)
            }

            let filename = docs[0].filename
            let splitFilename = filename.split('.')
            let fileExtension = splitFilename[splitFilename.length - 1]

            for (let i = 0; i < extensions.length; i++) {
              if (extensions[i] == fileExtension) {
                return resolve(hook)
              }
            }

            return reject(new errors.BadRequest('Yikes! This file doesn\'t seem to have the right extension...'))
          })
        })
      })
    })
  }
}

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

          hook.id = doc[field]

          return resolve(hook)
        })
      })
    })
  }
}

exports.isEmpty = function (field) {
  return function (hook) {
    return hook.result[field].length === 0
  }
}
