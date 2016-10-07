'use strict'

const message = require('./message')
const user = require('./user')

const mongoose = require('mongoose')

const authentication = require('./authentication')

module.exports = function () {
  const app = this

  mongoose.connect(app.get('mongodb'))
  mongoose.Promise = global.Promise

  app.configure(authentication)
  app.configure(user)
  app.configure(message)
}
