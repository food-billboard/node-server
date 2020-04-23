const Router = require('@koa/router')
const Info = require('./routes/info')

const router = new Router()

router
.use('/info', Info.routes(), Info.allowedMethods())

module.exports = router