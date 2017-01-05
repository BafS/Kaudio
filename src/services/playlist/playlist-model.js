'use strict'

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const playlistSchema = new Schema({
  name: { type: String, required: true, trim: true },
  public: { type: Boolean, required: true },

  description: String,

  user_ref: {
    type: ObjectId,
    ref: 'user'
  },

  tracks_ref: [{
    type: ObjectId,
    ref: 'track'
  }],

  user: Object,
  tracks: [{
    _id: ObjectId,
    title: String,
    album: {
      _id: ObjectId,
      title: String,
      artist: {
        _id: ObjectId,
        name: String
      }
    }
  }],

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(playlistSchema)

const playlistModel = mongoose.model('playlist', playlistSchema)

module.exports = playlistModel
