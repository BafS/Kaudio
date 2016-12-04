'use strict'

const handler = require('feathers-errors/handler')
const notFound = require('./not-found-handler')
const logger = require('./logger')
const multer = require('multer')
const multipartMiddleware = multer()
const blobService = require('feathers-blob')
const fsbs = require('fs-blob-store')
const path = require('path')
const appDir = path.dirname(require.main.filename)
const storagePath = appDir + '/../uploads'
const blobStorage = fsbs(storagePath)
const dauria = require('dauria')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const fs = require('fs')
Grid.mongo = mongoose.mongo

module.exports = function () {
  // Add your custom middleware here. Remember, that
  // just like Express the order matters, so error
  // handling middleware should go last.
  const app = this

  app.use('/uploads',
    multipartMiddleware.single('uri'),

    function (req, res, next) {
      req.feathers.file = req.file

      next()
    },

    blobService({ Model: blobStorage }),

    // this can modify the response
    function (req, res, next) {
      // upload file to DB
      let gfs = Grid(mongoose.connection.db)
      let writestream = gfs.createWriteStream({
        filename: res.data.id
      })

      fs.createReadStream(storagePath + '/' + res.data.id).pipe(writestream)

      gfs.findOne({ filename: res.data.id }, function (err, file) {
        if (err) {
          next(err)
        }
        // don't send uploaded data back to the user
        delete res.data.uri
        delete res.data.size
        delete res.data.id

        // add file id
        res.data._id = file._id

        next()
      })
    }
  )

  app.service('/uploads').before({
    create: [
      function (hook) {
        if (!hook.data.uri && hook.params.file) {
          const file = hook.params.file
          const uri = dauria.getBase64DataURI(file.buffer, file.mimetype)
          hook.data = { uri: uri }
        }
      }
    ]
  })

  app.service('/uploads').after({
    create: [
      function (hook) {

      }
    ]
  })

  app.use(notFound())
  app.use(logger(app))
  app.use(handler())
}
