'use strict'
const playlist = require('./playlist');
const track = require('./track')
const person = require('./person')
const album = require('./album')
const artist = require('./artist')

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
  app.configure(artist)
  app.configure(album)
  app.configure(person)
  app.configure(track)
  app.configure(playlist);
}
