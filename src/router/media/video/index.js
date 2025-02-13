const Router = require('@koa/router')
const Poster = require('./poster')
const Merge = require('./merge')
const Corp = require('./corp')

const router = new Router()

router
.use('/poster', Poster.routes(), Poster.allowedMethods())
// .use('/merge', Merge.routes(), Merge.allowedMethods())
.use('/corp', Corp.routes(), Corp.allowedMethods())

module.exports = router