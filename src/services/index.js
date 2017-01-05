'use strict'
const search = require('./search')
const audio = require('./audio')
const playlist = require('./playlist')
const track = require('./track')
const person = require('./person')
const album = require('./album')
const artist = require('./artist')
const message = require('./message')
const user = require('./user')
const mongoose = require('mongoose')
const authentication = require('./authentication')
const Grid = require('gridfs-stream')
Grid.mongo = mongoose.mongo

module.exports = function () {
  const app = this

  mongoose.connect(app.get('mongodb'))

  mongoose.connection.on('error', function (err) {
    console.error('Mongo error, be sure that MongoDB is running')
    if (err) throw err
  })

  mongoose.Promise = global.Promise

  app.configure(authentication)
  app.configure(user)
  app.configure(message)
  app.configure(artist)
  app.configure(album)
  app.configure(person)
  app.configure(track)
  app.configure(playlist)
  app.configure(audio)
  app.configure(search)
}
