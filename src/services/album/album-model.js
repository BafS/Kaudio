'use strict'

// album-model.js - A mongoose model

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const albumSchema = new Schema({
  title: { type: String, required: true },
  year: Number, // release year
  coverArt: ObjectId, // Link to GridFS

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

  artist: Object,
  tracks: Object,

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(albumSchema)

const albumModel = mongoose.model('album', albumSchema)

module.exports = albumModel
