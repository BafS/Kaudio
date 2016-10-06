const express = require('express')
const router = express.Router()

/**
 * @api {get} /users/:id
 */
router.get('/', (req, res, next) => {
  res.json({ user: 'test' })
})

module.exports = router
