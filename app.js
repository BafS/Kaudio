const express = require('express')
const path = require('path')
const logger = require('morgan')
// const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const fs = require('fs')

const modelsPath = path.join(__dirname, 'app/models')

// Bootstrap models
fs.readdirSync(modelsPath)
  .filter(file => ~file.search(/^[^\.].*\.js$/))
  .forEach(file => require(path.join(modelsPath, file)))

// Register routes
const routes = require('./app/routes/index')
const users = require('./app/routes/users')

const app = express()

const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/kaudio1')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(cookieParser())
// app.use(express.static(path.join(__dirname, 'public')))

app.use('/', routes)
app.use('/users', users)

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500)
    res.render('error', {
      message: err.message,
      error: err
    })
  })
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    error: {}
  })
})

module.exports = app
