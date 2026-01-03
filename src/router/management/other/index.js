const Router = require('@koa/router')
const Holiday = require('./holiday')
const router = new Router()

router
// 假期
.use('/holiday', Holiday.routes(), Holiday.allowedMethods())

module.exports = router