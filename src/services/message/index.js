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

  // Send messages only to people who "follow" you (people who have yourself as a friend)
  messageService.filter(function (data, connection, hook) {
    const messageUserId = hook.params.user._id
    const currentUserFriends = connection.user.friends // Array<User>

    //console.log('me', hook.params.user)
    //console.log(currentUserFriends)

    // Check friendship
    const matches = currentUserFriends.filter(o => messageUserId.equals(o._id))
    // console.log(matches)

    // Do not send if nobody follow you
    if (!matches.length) {
      // console.log('no')
      return false
    }

    data.sender = { email: hook.params.user.email, name: hook.params.user.name }

    return data
  })

  // Set up our before hooks
  messageService.before(hooks.before)

  // Set up our after hooks
  messageService.after(hooks.after)
}

module.exports.Service = Service
