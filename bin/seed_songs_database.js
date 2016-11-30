const fs = require('fs')
const glob = require('glob')
const mm = require('musicmetadata')

const musicFolder = './music/**/*.{mp3,ogg,m4a,wma}'

glob(musicFolder, {}, (er, files) => {
  // console.log(files)
  files.forEach(file => {
    mm(fs.createReadStream(file), (err, metadata) => {
      if (err) throw err
      console.log(metadata)
    })
  })
})

/*

const feathers = require('feathers')
const seeder = require('feathers-seeder')
const seederConfig = {
  services: [
    {
      path: 'users',
      count: 2,
      template: {
        email: '{{name.firstName}}',
        password: '{{internet.password}}'
      }
    }
  ]
}

const app = feathers()

app
  .use('/users', require('feathers-mongoose'))
  .configure(seeder(seederConfig))

module.exports = app
*/





//
// 'use strict'
//
// const path = require('path')
// const compress = require('compression')
// const feathers = require('feathers')
// const configuration = require('feathers-configuration')
// const hooks = require('feathers-hooks')
// const middleware = require('./../src/middleware')
// const services = require('./../src/services')
//
// const Service = require('feathers-mongoose').Service
//
// console.log(Service);
//
// const app = feathers()
//   .configure(hooks())
//   .configure(services)
//
// // app.configure(configuration('./../'))
//
// class MyService extends Service {
//   create(data, params) {
//     // data.created_at = new Date();
//
//     console.log(data)
//     return super.create(data, params);
//   }
//
//   update(id, data, params) {
//     // data.updated_at = new Date();
//
//     console.log(data);
//     return super.update(id, data, params);
//   }
// }
//
// app.use('/users', new MyService({
//   paginate: {
//     default: 2,
//     max: 4
//   }
// }));
//
//
// // const app = feathers()
// //   .configure(hooks())
// //
// // app.configure(configuration(path.join(__dirname, '..')))
//
// // app.use(compress())
// //   .configure(hooks())
// //   // .configure(rest())
// //   // .configure(socketio(/))
// //   .configure(services)
// //   // .configure(middleware)
//
// // app.service('users').before({
// //   create(hook) {
// //     console.log(hook)
// //   },
// //   update(hook) {
// //     console.log(hook)
// //   }
// // })
// //
// // app.use('users', function (a) {
// //   console.log(a)
// // })
