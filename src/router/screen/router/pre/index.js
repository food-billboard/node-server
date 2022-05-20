const Router = require('@koa/router')
const Request = require('./request')

const router = new Router()

router
.use('/request', Request.routes(), Request.allowedMethods())

module.exports = router