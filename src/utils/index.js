const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
const Error = require('./error-deal')
const Validator = require('./validator')
const Redis = require('./redis')
const Static = require('./static')
module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token,
  ...Error,
  ...Validator,
  ...Redis,
  ...Static
}