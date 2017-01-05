'use strict'

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const artistSchema = new Schema({
  name: { type: String, required: true },

  // start year (e.g.:2002)
  year: Number,

  // City, State, Country
  origin: String,

  // published by the artist
  albums_ref: [{
    type: ObjectId,
    ref: 'album'
  }],

  // "Appears On" albums, e.g. compilations
  aOAlbums_ref: [{
    type: ObjectId,
    ref: 'album'
  }],

  persons_ref: [{
    type: ObjectId,
    ref: 'person'
  }],

  albums: Object,
  aOAlbums: Object,
  persons: Object,

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(artistSchema)

const artistModel = mongoose.model('artist', artistSchema)

module.exports = artistModel
