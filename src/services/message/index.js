'use strict'

const hooks = require('./hooks')

class Service {
  constructor (options) {
    this.options = options || {}
  }

  find (params) {
    return Promise.resolve([])
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    })
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
  app.use('/messages', new Service())

  // Get our initialize service to that we can bind hooks
  const messageService = app.service('/messages')

  messageService.filter(function (data, connection, hook) {
    // console.log('-FILTER-')

    const messageUserId = hook.params.user._id
    const currentUserFriends = connection.user.friends // Array

    // console.log(messageUserId)
    // console.log(currentUserFriends)

    // Check friendship
    // if (currentUserFriends.indexOf(messageUserId) === -1) {
    if (currentUserFriends.includes(messageUserId)) {
      console.log('no')
      return false
    }

    return data
  })

  // Set up our before hooks
  messageService.before(hooks.before)

  // Set up our after hooks
  messageService.after(hooks.after)
}

module.exports.Service = Service
