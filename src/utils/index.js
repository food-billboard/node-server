const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
const Error = require('./error-deal')
const Validator = require('./validator')
module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token,
  ...Error,
  ...Validator
}