const MongoDB = require('./mongodb')
const Tool = require('./tool')
module.exports = {
  MongoDB: function(url="mongodb://localhost:27017/test", name="test") {
    return new MongoDB(url, name)
  },
  ...Tool
}