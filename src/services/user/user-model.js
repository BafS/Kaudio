'use strict'

// user-model.js - A mongoose model

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const userSchema = new Schema({
  facebookId: { type: String },
  facebook: { type: Schema.Types.Mixed },

  email: { type: String, required: true, unique: true }, // require
  password: { type: String, required: true }, // require
  name: String,
  age: Number,
  country: String,
  city: String,
  picture: ObjectId, // Link to GridFS

  friends_ref: [{
    type: ObjectId,
    ref: 'user'
  }],

  friends: Object,

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(userSchema)

const userModel = mongoose.model('user', userSchema)

module.exports = userModel
