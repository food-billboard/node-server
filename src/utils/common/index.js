const initialUserData = require('./initialUserData')
const CommonAggregateMovie = require('./common-aggregate-movie-')

module.exports = {
  initialUserData,
  ...CommonAggregateMovie
}