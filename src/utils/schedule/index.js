const Media = require('./media')
const Tag = require('./tag')
const Movie = require('./movie')

module.exports = {
  ...Media,
  ...Tag,
  ...Movie
}