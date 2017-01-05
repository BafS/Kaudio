'use strict'

const path = require('path')
const serveStatic = require('feathers').static
// const favicon = require('serve-favicon')
const compress = require('compression')
const cors = require('cors')
const feathers = require('feathers')
const configuration = require('feathers-configuration')
const hooks = require('feathers-hooks')
const rest = require('feathers-rest')
const bodyParser = require('body-parser')
const socketio = require('feathers-socketio')
const middleware = require('./middleware')
const services = require('./services')

const app = feathers()

app.configure(configuration(path.join(__dirname, '..')))

/**
 * Formats response. Do not remove!
 * Allows to send 'audio/mpeg' content on
 * /audios enpoint as audio and not JSON
 */
function restFormatter (req, res) {
  res.format({
    'default': function () {
      res.send(res.data)
    }
  })
}

app.use(compress())
  .options('*', cors())
  .use(cors())
  .use('/', serveStatic(app.get('public')))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .configure(hooks())
  .configure(rest(restFormatter))
  .configure(socketio())
  .configure(services)
  .configure(middleware)

module.exports = app
