const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token
}