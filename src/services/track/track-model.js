'use strict'

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const trackSchema = new Schema({
  title: { type: String, required: true },

  // original album it was released on
  album_ref: {
    type: ObjectId,
    ref: 'album'
  },

  // if track is in compilations album (AO stands for "appears on")
  aOAlbums_ref: [{
    artist_ref: {
      type: ObjectId,
      ref: 'artist',
      required: true
    },
    album_ref: {
      type: ObjectId,
      ref: 'album',
      required: true
    }
  }],

  album: Object,
  artist: Object,

  // Link to GridFS
  file: ObjectId,

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(trackSchema)

const trackModel = mongoose.model('track', trackSchema)

module.exports = trackModel
