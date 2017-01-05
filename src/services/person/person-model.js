'use strict'

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const personSchema = new Schema({
  // can be 'Fname Lname' birth name OR a stage name
  name: { type: String, required: true },

  // stageName if typeof name === 'Fname Lname'
  aka: String,

  // start year
  year: Number,

  // bands this person is part of
  artists_ref: [{
    type: ObjectId,
    ref: 'artist'
  }],

  createdAt: { type: Date, 'default': Date.now },
  updatedAt: { type: Date, 'default': Date.now }
})

idexists.forSchema(personSchema)

const personModel = mongoose.model('person', personSchema)

module.exports = personModel
