'use strict'

const service = require('feathers-mongoose')
const album = require('./album-model')
const hooks = require('./hooks')

module.exports = function () {
  const app = this

  const options = {
    Model: album,
    paginate: {
      default: 5,
      max: 25
    }
  }

  // Initialize our service with any options it requires
  app.use('/albums', service(options))

  // Get our initialize service to that we can bind hooks
  const albumService = app.service('/albums')

  // Set up our before hooks
  albumService.before(hooks.before)

  // Set up our after hooks
  albumService.after(hooks.after)
}
