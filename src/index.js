const Router = require('@koa/router')
const Api = require('./router')

const router = new Router()

router.use('/api', Api.routes(), Api.allowedMethods())

module.exports = router