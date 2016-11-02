'use strict'

const service = require('feathers-mongoose')
const artist = require('./artist-model')
const hooks = require('./hooks')

module.exports = function () {
  const app = this

  const options = {
    Model: artist,
    paginate: {
      default: 5,
      max: 25
    }
  }

  // Initialize our service with any options it requires
  app.use('/artists', service(options))

  // Get our initialize service to that we can bind hooks
  const artistService = app.service('/artists')

  // Set up our before hooks
  artistService.before(hooks.before)

  // Set up our after hooks
  artistService.after(hooks.after)
}
