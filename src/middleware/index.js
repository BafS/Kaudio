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
  const app = this

  // Store uploaded blob to DB
  app.use('/uploads',
    multipartMiddleware.single('uri'),

    function (req, res, next) {
      req.feathers.file = req.file
      next()
    },

    blobService({ Model: blobStorage })
  )

  // Configure before and after hooks
  app.service('/uploads').before(uploads.prepareUpload(app))
  app.service('/uploads').after(uploads.cleanUpUpload(app))

  // Count number of failed and successfull uploads from
  // local directory
  app.use('/localuploads', {
    create (data, params) {
      return Promise.resolve({ added: data.filesOk, failed: data.filesFailed })
    }
  })

  // Configure before and after hooks
  app.service('/localuploads').before(uploads.prepareLocalUpload(app))
  app.service('/localuploads').after(uploads.cleanUpLocalUpload(app))

  // Error handling
  app.use(notFound())
  app.use(logger(app))
  app.use(handler())
}
