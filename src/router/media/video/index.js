const Router = require('@koa/router')
const Poster = require('./poster')

const router = new Router()

router
.use('/poster', Poster.routes(), Poster.allowedMethods())

module.exports = router