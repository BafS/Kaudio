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
const errors = require('feathers-errors')
const ObjectId = require('mongodb').ObjectID


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

/**
 * Adds the data in the hook, so multipart/form-data is seen as one single object
 */
const putDataInHook = function (options) {
  return function (hook) {
    if (!hook.data.uri && hook.params.file) {
      const file = hook.params.file
      const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
      hook.data = { uri: uri }
    }
  }
}

/**
 * Checks if the album/artist/track combinantion already exists
 */
const checkOneTrack = function (metadata) {
  return function (res) {
    if (res.title === metadata.title && res.album.title === metadata.album && res.album.artist.name === metadata.artist[0]) {
      return Promise.reject(new errors.BadRequest('This track/album/artist combination already exists'))
    }
    return Promise.resolve()
  }
}

const checkNotExisting = function (filePath, app) {
  return globalHooks.connection.then(db => {
    const collection = db.collection('tracks')
    return new Promise((resolve, reject) => {
      return musicmetadata(fs.createReadStream(filePath), function (err, metadata) {
        if (err) {
          return reject(err)
        }

        // search all tracks with same name
        return collection.find({ title: metadata.title }).toArray(function (err, docs) {
          if (err) {
            return reject(err)
          }

          if (docs.length === 0) {
            return resolve()
          }

          let objId
          let promise = []

          for (let i = 0; i < docs.length; ++i) {
            objId = ObjectId(docs[i]._id)
            promise.push(app.service('tracks').get({ _id: objId }).then(checkOneTrack(metadata)))
          }

          Promise.all(promise).then(values => {
            return resolve()
          })
          .catch(err => {
            return reject(err)
          })
        })
      })
    })
  })
}

/**
 * Pipes the song to DB and adds references for later searching
 */
const pipeToDB = function (app) {
  return function (hook) {
    // generate new _id
    let fileId = mongoose.Types.ObjectId()

    // set _id in response
    hook.result._id = fileId

    let gfs = Grid(mongoose.connection.db)
    let writestream = gfs.createWriteStream({
      filename: hook.result.id,
      _id: fileId
    })

    let filePath = storagePath + '/' + hook.result.id

    checkNotExisting(filePath, app)
      .then(function (res) {
        fs.createReadStream(filePath).pipe(writestream)

        // Once file is written to DB, add all the ObjectId references
        writestream.on('close', function (file) {
          musicmetadata(gfs.createReadStream({ _id: fileId }), function (err, metadata) {
            if (err) {
              throw err
            }

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
              .then(function (res) {
                fs.unlinkSync(filePath)
                return Promise.resolve(res)
              })
              .catch(function (err) {
                console.log(err)
              })
          })
        })
      })
      .catch(function (err) {
        console.log(err)
        fs.unlinkSync(filePath)
      })
  }
}

/*const checkOneSong = function (options){
  return function(track){
    if(track.title)
  }
}*/




/*return globalHooks.connection.then(db => {
  const trackCollection = db.collection('tracks')

  return new Promise((resolve, reject) => {
    console.log('in promise')
    trackCollection.find({ name: hook.data.name }).toArray(function (err, docs) {
      if (err) {
        return reject(err)
      }

      // there is no track with this name
      if (docs.length == 0) {
        return resolve(hook)
      }

      let promise = app.service('tracks').get({ _id: docs[0]._id })

      for (let i = 0; i < docs.length; ++i) {
        promise.then(app.service('tracks').get({ _id: docs[i]._id }))
      }

    })
  })
})*/


exports.beforeUpload = function (app) {
  return {
    create: [
      putDataInHook()
    ]
  }
}

exports.afterUpload = function (app) {
  return {
    create: [
      hooks.remove('uri'),
      hooks.remove('size'),
      pipeToDB(app),
      hooks.remove('id')
    ]
  }
}
