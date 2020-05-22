const Router = require('@koa/router')
const Browser = require('./browser')
const Store = require('./store')

const router = new Router()

router
.get('/', async(ctx) => {})
.use('/browser', Browser.routes(), Browser.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router