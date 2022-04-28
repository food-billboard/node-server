const mongoose = require("mongoose")
const chalk = require('chalk')
const Lib = require("./mongo.lib")
const { initAuthMapData } = require('../auth')
const { scheduleConstructor } = require('../schedule')
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
      //定时任务
      scheduleConstructor.init()
    })
    // .catch(err => {
    //   console.log(chalk.bgRed('the mongodb server is run in error'))
    //   console.log(err)
    // })
  }
  return Promise.resolve()
}

function objectIdFormat(id) {
  return id.split(",").map(item => mongoose.Types.ObjectId(item.trim()))
}

function objectIdValid(id) {
  return id.split(",").every(item => mongoose.Types.ObjectId.isValid(item.trim()))
}

module.exports = {
  ...Lib,
  objectIdFormat,
  objectIdValid,
  MongoDB: connectTry(MongoDB, {
    msg: 'the mongodb server is run in error'
  })
}

