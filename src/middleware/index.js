'use strict'

const handler = require('feathers-errors/handler')
const notFound = require('./not-found-handler')
const logger = require('./logger')
const uploads = require('./uploads')
const multer = require('multer')
const multipartMiddleware = multer()
const blobService = require('feathers-blob')
const fsbs = require('fs-blob-store')
const path = require('path')
const appDir = path.dirname(require.main.filename)
const storagePath = appDir + '/../uploads'
const blobStorage = fsbs(storagePath)
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
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

    blobService({ Model: blobStorage })
  )

  app.service('/uploads').before(uploads.prepareUpload(app))
  app.service('/uploads').after(uploads.cleanUpUpload(app))

  app.use('/localuploads', {
    create (data, params) {
      return Promise.resolve({ added: data.filesOk, failed: data.filesFailed })
    }
  })

  app.service('/localuploads').before(uploads.prepareLocalUpload(app))
  app.service('/localuploads').after(uploads.cleanUpLocalUpload(app))

  app.use(notFound())
  app.use(logger(app))
  app.use(handler())
}
