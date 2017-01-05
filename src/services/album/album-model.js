'use strict'

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const albumSchema = new Schema({
  title: { type: String, required: true },

  // release year
  year: Number,

  // Link to GridFS, TODO
  coverArt: ObjectId,

  // if released by ONE artist (i.e. not a compilation)
  artist_ref: {
    type: ObjectId,
    ref: 'artist'
  },

  // track number is implied
  tracks_ref: [{
    type: ObjectId,
    ref: 'track'
  }],

  // Used by populate script
  artist: Object,
  tracks: Object,

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(albumSchema)

const albumModel = mongoose.model('album', albumSchema)

module.exports = albumModel
