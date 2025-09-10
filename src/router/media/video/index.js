const Router = require('@koa/router')
const Poster = require('./poster')
const Merge = require('./merge')
const Corp = require('./corp')
const Create = require('./create')

const router = new Router()

router
.use('/poster', Poster.router.routes(), Poster.router.allowedMethods())
.use('/merge', Merge.routes(), Merge.allowedMethods())
.use('/corp', Corp.routes(), Corp.allowedMethods())
.use('/create', Create.routes(), Create.allowedMethods())

module.exports = router