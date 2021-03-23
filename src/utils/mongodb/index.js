const mongoose = require("mongoose")
const chalk = require('chalk')
const Lib = require("./mongo.lib")
const { initAuthMapData } = require('../auth')
const { connectTry } = require('../tool')

let instance = false

async function MongoDB(url="mongodb://127.0.0.1:27017/movie") {
  if(!instance) {
    instance = true
    return mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false
    })
    .then(_ => {
      // initAuthMapData()
      console.log(chalk.bgGreen('the mongodb server is run in port 27017'))
    })
    // .catch(err => {
    //   console.log(chalk.bgRed('the mongodb server is run in error'))
    //   console.log(err)
    // })
  }
  return Promise.resolve()
}

module.exports = {
  ...Lib,
  MongoDB: connectTry(MongoDB, {
    msg: 'the mongodb server is run in error'
  })
}

