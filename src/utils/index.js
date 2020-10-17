const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
const Error = require('./error-deal')
const Validator = require('./validator')
const Redis = require('./redis')
const Static = require('./static')
const Email = require('./email')
const Auth = require('./auth')

module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token,
  ...Error,
  ...Validator,
  ...Redis,
  ...Static,
  ...Email,
  ...Auth
}