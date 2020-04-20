const Router = require('@koa/router')
const Browse = require('./browse')
const Store = require('./store')

const router = new Router()

router.use('/browse', Browse.routes(), Browse.allowedMethods())
router.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router