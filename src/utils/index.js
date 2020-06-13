const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
const Error = require('./error-deal')
const Media = require('./media-deal')
module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token,
  ...Error,
  ...Media
}