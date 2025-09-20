const Router = require('@koa/router')
const Poster = require('./poster')
const Merge = require('./merge')
const Corp = require('./corp')
const Create = require('./create')
const Exchange = require('./exchange')
const Compress = require('./compress')

const router = new Router()

router
.use('/poster', Poster.router.routes(), Poster.router.allowedMethods())
.use('/merge', Merge.routes(), Merge.allowedMethods())
.use('/corp', Corp.routes(), Corp.allowedMethods())
.use('/create', Create.routes(), Create.allowedMethods())
.use('/exchange', Exchange.routes(), Exchange.allowedMethods())
.use('/compress', Compress.routes(), Compress.allowedMethods())

module.exports = router