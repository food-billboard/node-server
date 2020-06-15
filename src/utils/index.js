const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
const Error = require('./error-deal')
module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token,
  ...Error,
}