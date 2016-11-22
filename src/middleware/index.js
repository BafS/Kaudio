'use strict'

const handler = require('feathers-errors/handler')
const notFound = require('./not-found-handler')
const logger = require('./logger')
const multer = require('multer')
const multipartMiddleware = multer()
const blobService = require('feathers-blob')
const fs = require('fs-blob-store')
const path = require('path')
const appDir = path.dirname(require.main.filename)
const blobStorage = fs(appDir + '/../uploads')
const dauria = require('dauria')

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

  app.use(notFound())
  app.use(logger(app))
  app.use(handler())
}
