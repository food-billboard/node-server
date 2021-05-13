const Head = require('./head')
const Patch = require('./patch')
const Post = require('./post')

module.exports = {
  ...Head,
  ...Patch,
  ...Post,
}