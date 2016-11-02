'use strict'

// person-model.js - A mongoose model

const idexists = require('mongoose-idexists')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const personSchema = new Schema({
  name: { type: String, required: true }, // can be 'Fname Lname' birth name OR a stage name
  aka: String, // stageName if typeof name === 'Fname Lname'
  year: Number,  // start year

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
