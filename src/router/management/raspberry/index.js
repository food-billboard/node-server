const Router = require('@koa/router')
const Package = require('./package')

const router = new Router()

router
.use('/package', Package.routes(), Package.allowedMethods())

module.exports = router