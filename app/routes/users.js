const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const User = mongoose.model('User')

// mongoose.Promise = global.Promise

/**
 * @api {get} /users/:id
 */
router.get('/:login', (req, res, next) => {
  res.json({ user: req.params.login })
})

/**
 * @api {post} /users/ Create a new user
 */
router.get('/new', (req, res, next) => {
  let user = new User({ name: 'user', email: 'test', password: 'qwe' })

  user.save().then(function (doc) {
    console.log('okok')
    res.json({ result: 'ok' })
  })
})

module.exports = router
