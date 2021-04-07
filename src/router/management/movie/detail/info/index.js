const Router = require('@koa/router')
const Language = require('./language')
const Actor = require('./actor')
const District = require('./district')
const Director = require('./director')
const Classify = require('./classify')
const { Auth } = require('./auth')

const router = new Router()

router
.use(Auth)
.use('/language', Language.routes(), Language.allowedMethods())
.use('/actor', Actor.routes(), Actor.allowedMethods())
.use('/district', District.routes(), District.allowedMethods())
.use('/director', Director.routes(), Director.allowedMethods())
.use('/classify', Classify.routes(), Classify.allowedMethods())

module.exports = router