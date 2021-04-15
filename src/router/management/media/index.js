const Router = require('@koa/router')
const Media = require('./routes')

const router = new Router()

router
.use('/', Media.routes(), Media.allowedMethods())


module.exports = router