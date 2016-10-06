const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', (req, res) => {
  res.send(`
    <h2>Welcom to Kaudio backend</h2>
    Please use a valid API route.
  `)
})

module.exports = router
