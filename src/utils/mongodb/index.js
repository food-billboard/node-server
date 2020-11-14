const mongoose = require("mongoose")
const Lib = require("./mongo.lib")
const { initAuthMapData } = require('../auth')

let instance = false

function MongoDB(url="mongodb://localhost:27017/movie") {
  if(!instance) {
    instance = true
    mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false
    })
    .then(_ => {
      // initAuthMapData()
    })
    .catch(err => {
      
    })
  }
}

module.exports = {
  ...Lib,
  MongoDB
}

