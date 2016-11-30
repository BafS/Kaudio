#!/usr/bin/env node

'use strict'

const mongoose = require('mongoose')
const seeder = require('mongoose-seeder')
// const tracks = require('./seeds/tracks.json')
const users = require('./seeds/users.json')

mongoose.connect('mongodb://localhost/Kaudio')

seeder.seed(users, {dropDatabase: true}).then(dbData => {
    // The database objects are stored in dbData
}).catch(err => {
  console.error(err)
})
