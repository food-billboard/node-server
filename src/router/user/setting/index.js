const Router = require('@koa/router')
const Info = require('./routes')

const router = new Router()

router.use('/info', Info.routes(), Info.allowedMethods())

module.exports = router