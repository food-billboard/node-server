const Router = require('@koa/router')
const Card = require('./navCard')
const Statistics = require('./statistics')
const Movie = require('./movie')

const router = new Router()

router
.use('/nav', Card.routes(), Card.allowedMethods())
.use('/statistics', Statistics.routes(), Statistics.allowedMethods())
.use('/search', Movie.routes(), Movie.allowedMethods())

module.exports = router