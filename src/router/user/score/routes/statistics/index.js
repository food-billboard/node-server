const Router = require('@koa/router')
const Award = require('./award')
const Classify = require('./classify')
const Memory = require('./memory')

const router = new Router()

router
.use('/classify', Classify.routes(), Classify.allowedMethods())
.use('/award', Award.routes(), Award.allowedMethods())
.use('/memory', Memory.routes(), Memory.allowedMethods())

module.exports = router