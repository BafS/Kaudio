'use strict'

// user-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
  facebookId: { type: String },
  facebook: { type: Schema.Types.Mixed },

  email: {type: String, required: true, unique: true}, // require
  password: { type: String, required: true }, // require

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

const userModel = mongoose.model('user', userSchema)

module.exports = userModel
