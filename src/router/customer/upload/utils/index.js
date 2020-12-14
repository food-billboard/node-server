const { patch } = require('../routes')
const Head = require('./head')
const Patch = require('./patch')

module.exports = {
  ...Head,
  ...Patch
}