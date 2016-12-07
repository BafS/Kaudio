'use strict'

const hooks = require('feathers-hooks-common')
const path = require('path')
const appDir = path.dirname(require.main.filename)
const storagePath = appDir + '/../uploads'
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const fs = require('fs')
const dauria = require('dauria')
const musicmetadata = require('musicmetadata')
const globalHooks = require('../hooks')


/**
 * If object already exists, returns its _id
 * Otherwise, it creates the object with the appropriate service
 * and then returns the new _id
 */
const getDBref = function (app, service, searchObj) {
  return globalHooks.connection.then(db => {
    const collection = db.collection(service)
    return new Promise((resolve, reject) => {
      collection.findOne(searchObj, function (err, doc) {
        if (err) {
          return reject(err)
        }

        if (doc) {
          return resolve(doc)
        }

        return resolve(app.service(service).create(searchObj))
      })
    })
  })
}

/**
 *Adds the ObjectId refs in the DB
 */
const addDBref = function (app, service, objToEdit, field, isArray, referencedObj) {
  return globalHooks.connection.then(db => {
    const collection = db.collection(service)
    return new Promise((resolve, reject) => {
      collection.findOne({ _id: objToEdit._id }, function (err, doc) {
        if (err) {
          return reject(err)
        }

        if (isArray) {
          for (let i = 0; i < doc[field].length; ++i) {
            if (String(doc[field][i]) === String(referencedObj._id)) {
              return resolve(doc)
            }
          }

          let newVal = doc[field]
          newVal.push(referencedObj._id)
          doc[field] = newVal
        } else {
          if (doc[field] === referencedObj._id) {
            return resolve(doc)
          }
          doc[field] = referencedObj._id
        }
        collection.findOneAndUpdate({ _id: objToEdit._id }, doc, function (err1, doc1) {
          if (err1) {
            return reject(err1)
          }
          return resolve(doc1)
        })
      })
    })
  })
}

exports.beforeUpload = function () {
  return {
    create: [
      function (hook) {
        if (!hook.data.uri && hook.params.file) {
          const file = hook.params.file
          const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
          hook.data = { uri: uri }
        }
      }
    ]
  }
}

exports.afterUpload = function (app) {
  return {
    create: [
      hooks.remove('uri'),
      hooks.remove('size'),

      function (hook) {
        // generate new _id
        let fileId = mongoose.Types.ObjectId()

        // set _id in response
        hook.result._id = fileId

        let gfs = Grid(mongoose.connection.db)
        let writestream = gfs.createWriteStream({
          filename: hook.result.id,
          _id: fileId
        })

        fs.createReadStream(storagePath + '/' + hook.result.id).pipe(writestream)

        writestream.on('close', function (file) {
          musicmetadata(gfs.createReadStream({ _id: fileId }), function (err, metadata) {
            if (err) throw err

            let artist, album, track

            getDBref(app, 'artists', { name: metadata.artist[0] })
              .then(function (res) {
                artist = res
                return getDBref(app, 'albums', { title: metadata.album, artist_ref: artist._id })
              })
              .then(function (res) {
                album = res
                return getDBref(app, 'tracks', { title: metadata.title, album_ref: album._id })
              })
              .then(function (res) {
                track = res
                return addDBref(app, 'artists', artist, 'albums_ref', true, album)
              })
              .then(function (res) {
                return addDBref(app, 'albums', album, 'artist_ref', false, artist)
              })
              .then(function (res) {
                return addDBref(app, 'albums', album, 'tracks_ref', true, track)
              })
              .then(function (res) {
                return addDBref(app, 'tracks', track, 'album_ref', false, album)
              })
              .then(function (res) {
                let fileObj = {}
                fileObj._id = fileId
                return addDBref(app, 'tracks', track, 'file', false, fileObj)
              })
              .catch(function (err) {
                console.log(err)
              })
          })
        })
      },

      hooks.remove('id')
    ]
  }
}
