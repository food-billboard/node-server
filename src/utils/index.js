const MongoDB = require('./mongodb')
const Tool = require('./tool')
const Token = require('./token')
const Error = require('./error-deal')
const Validator = require('./validator')
const Redis = require('./redis')
const Static = require('./static')
const Email = require('./email')
const Auth = require('./auth')
const CustomerOperation = require('./customer-operation')
const Constant = require('./constant')
const Schedule = require('./schedule')
const PinYin = require('./pinyin')
const Video = require('./video')
const Media = require('./media')
const Middleware = require('./middleware')
const Common = require("./common")
const Download = require('./download')
const Third = require('./third')

module.exports = {
  ...MongoDB,
  ...Tool,
  ...Token,
  ...Error,
  ...Validator,
  ...Redis,
  ...Static,
  ...Email,
  ...Auth,
  ...CustomerOperation,
  ...Constant,
  ...Schedule,
  ...PinYin,
  ...Video,
  ...Media,
  ...Middleware,
  ...Common,
  ...Download,
  ...Third
}