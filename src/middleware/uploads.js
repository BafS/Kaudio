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
const auth = require('feathers-authentication').hooks

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

        // If it exists, return it
        if (doc) {
          return resolve(doc)
        }

        // Otherwise, create a new one and return it
        return resolve(app.service(service).create(searchObj))
      })
    })
  })
}

/**
 * Adds the ObjectId refs in the DB
 */
const addDBref = function (service, objToEdit, field, isArray, referencedObj) {
  return globalHooks.connection.then(db => {
    const collection = db.collection(service)
    return new Promise((resolve, reject) => {
      collection.findOne({ _id: objToEdit._id }, function (err, doc) {
        if (err) {
          return reject(err)
        }

        if (isArray) {
          for (let i = 0; i < doc[field].length; ++i) {
            // If it is already referenced, return it
            if (String(doc[field][i]) === String(referencedObj._id)) {
              return resolve(doc)
            }
          }

          // Otherwise add the reference
          let newVal = doc[field]
          newVal.push(referencedObj._id)
          doc[field] = newVal
        } else {
          // If it is already referenced, return it
          if (doc[field] === referencedObj._id) {
            return resolve(doc)
          }

          // Otherwise add the reference
          doc[field] = referencedObj._id
        }

        // Once it has been updated, search and return it
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
 * Adds the upload data in the hook,
 * so multipart/form-data is seen as one single object
 * on the server side
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
 * If it does, throw and exception, stopping the DB insertion
 */
const checkOneTrack = function (metadata) {
  return function (res) {
    if (res.title === metadata.title && res.album.title === metadata.album && res.album.artist.name === metadata.artist[0]) {
      return Promise.reject(new errors.BadRequest('This track/album/artist combination already exists'))
    }
    return Promise.resolve()
  }
}

/**
 * Checks if this audio track already exists in DB
 */
const checkAudioNotExisting = function (filePath, app, fileId) {
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

          // If there are non, all is good
          if (docs.length === 0) {
            return resolve()
          }

          let objId
          let promise = []

          // If there are tracks with same name, check each one to see if identical
          for (let i = 0; i < docs.length; ++i) {
            objId = ObjectId(docs[i]._id)
            promise.push(app.service('tracks').get({ _id: objId }).then(checkOneTrack(metadata)))
          }

          // If no exception has been noticed in checkOneTrack(), return
          Promise.all(promise).then(values => {
            return resolve()
          })
            // Duplicate has been found, delete the last inserted document
            .catch(err => {
              let id = new ObjectId(fileId)
              return db.collection('fs.files').remove({ _id: id }, function (err1) {
                if (err1) {
                  return reject(err1)
                }
                return reject(err)
              })
            })
        })
      })
    })
  })
}

/**
 * Adds track, artist, albums references in DB
 */
const addAudioRefs = function (app, gfs, fileId) {
  return function (res) {
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
          return addDBref('artists', artist, 'albums_ref', true, album)
        })
        .then(function (res) {
          return addDBref('albums', album, 'artist_ref', false, artist)
        })
        .then(function (res) {
          return addDBref('albums', album, 'tracks_ref', true, track)
        })
        .then(function (res) {
          return addDBref('tracks', track, 'album_ref', false, album)
        })
        .then(function (res) {
          let fileObj = {}
          fileObj._id = fileId
          return addDBref('tracks', track, 'file', false, fileObj)
        })
        .then(function (res) {
          return Promise.resolve(res)
        })
        .catch(function (err) {
          console.log(err)
        })
    })
  }
}

/**
 * Pipes an uploaded file to DB
 */
const pipeToDB = function (app) {
  return function (hook) {
    // generate new _id
    let fileId = mongoose.Types.ObjectId()

    // TODO set proper _id
    // set _id in response
    hook.result._id = fileId

    let gfs = Grid(mongoose.connection.db)
    let writestream = gfs.createWriteStream({
      filename: hook.result.id,
      _id: fileId
    })

    let filePath = storagePath + '/' + hook.result.id

    fs.createReadStream(filePath).pipe(writestream)

    writestream.on('close', function (file) {
      switch (hook.params.file.mimetype.split(('/'))[0]) {
        case 'audio':
          checkAudioNotExisting(filePath, app, fileId)
            .then(addAudioRefs(app, gfs, fileId))
            .then(function (res) {
              // delete the file from FS (it is now in DB)
              fs.unlinkSync(filePath)
              return res
            })
            .catch(function (err) {
              console.log(err)
            })
          break
        case 'image':
          // delete the file from FS
          fs.unlinkSync(filePath)
          throw new errors.BadRequest('This functionnality has been removed!')
        default:
          // delete the file from FS
          fs.unlinkSync(filePath)
          throw new errors.BadRequest('Unexpected mimetype')
      }
    })
  }
}

/**
 * Walks through the specified directory
 * and sub-directories and adds files
 * to result before executing callback
 * source: http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search#5827895
 */
const walk = function (dir, done) {
  let results = []
  fs.readdir(dir, function (err, list) {
    if (err) return done(err)
    let pending = list.length
    if (!pending) return done(null, results)
    list.forEach(function (file) {
      file = path.resolve(dir, file)
      fs.stat(file, function (err, stat) {
        if (err) {
          throw err
        }
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            if (err) {
              throw err
            }
            results = results.concat(res)
            if (!--pending) done(null, results)
          })
        } else {
          results.push(file)
          if (!--pending) done(null, results)
        }
      })
    })
  })
}

/**
 * Pipe files from local FS folder to DB
 */
const pipeLocalFilesToDB = function (app) {
  return function (hook, next) {
    let p = hook.data.path
    hook.data.filesOk = 0
    hook.data.filesFailed = 0
    let filesReviewed = 0
    let fileId, gfs, writestream

    if (p === undefined) {
      throw new errors.BadRequest('You must define a path property!')
    }

    if (!fs.existsSync(p)) {
      throw new errors.BadRequest('Path is not accessible!')
    }

    walk(p, function (err, files) {
      if (err) {
        throw err
      }

      let audioExtensions = app.get('audioExtensions')

      let map = files.filter(function (filePath) {
        for (let i = 0; i < audioExtensions.length; ++i) {
          // Only add files with the proper extension
          // (i.e. not all the files in folder)
          if (filePath.split('.').pop() === audioExtensions[i]) {
            return true
          }
        }
        return false
      })

      map.forEach(function (filePath) {
        fileId = new ObjectId()
        gfs = Grid(mongoose.connection.db)
        writestream = gfs.createWriteStream({
          filename: path.basename(filePath),
          _id: fileId
        })

        fs.createReadStream(filePath).pipe(writestream)

        writestream.on('close', function (file) {
          checkAudioNotExisting(filePath, app, file._id)
            .then(addAudioRefs(app, gfs, file._id))
            .then(function (res) {
              hook.data.filesOk++

              // All usefull files have been checked
              if (++filesReviewed === map.length) {
                next()
              }
            })
            .catch(function (err) {
              hook.data.filesFailed++

              // All usefull files have been checked
              if (++filesReviewed === map.length) {
                next()
              }
              console.log(err)
            })
        })
      })
    })
  }
}

exports.prepareUpload = function (app) {
  return {
    create: [
      auth.verifyToken(),
      putDataInHook()
    ]
  }
}

exports.cleanUpUpload = function (app) {
  return {
    create: [
      hooks.remove('uri'),
      hooks.remove('size'),
      pipeToDB(app),
      hooks.remove('id')
    ]
  }
}

exports.prepareLocalUpload = function (app) {
  return {
    create: [
      auth.verifyToken(),
      pipeLocalFilesToDB(app)
    ]
  }
}

exports.cleanUpLocalUpload = function (app) {
  return {
    create: []
  }
}
