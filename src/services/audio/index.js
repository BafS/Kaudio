'use strict'

const hooks = require('./hooks')
const mongoose = require('mongoose')
const Grid = require('gridfs-stream')
const streamToPromise = require('stream-to-promise')
Grid.mongo = mongoose.mongo

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    return Promise.resolve([])
  }

  get (id, params) {
    let gfs = Grid(mongoose.connection.db)
    let readstream = gfs.createReadStream({
      _id: id
    })

    return Promise.resolve(streamToPromise(readstream))
  }

  create (data, params) {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current)))
    }

    return Promise.resolve(data)
  }

  update (id, data, params) {
    return Promise.resolve(data)
  }

  patch (id, data, params) {
    return Promise.resolve(data)
  }

  remove (id, params) {
    return Promise.resolve({ id })
  }
}

module.exports = function () {
  const app = this

  // Initialize our service with any options it requires
  app.use('/audios',
    function (req, res, next) {
      req.feathers.path = req.path
      req.feathers.service = 'audios'
      next()
    },
    new Service())

  // Get our initialize service to that we can bind hooks
  const audioService = app.service('/audios')

  // Set up our before hooks
  audioService.before(hooks.before)

  // Set up our after hooks
  audioService.after(hooks.after)
}

module.exports.Service = Service
