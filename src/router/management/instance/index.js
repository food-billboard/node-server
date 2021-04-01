const Router = require('@koa/router')
const Info = require('./info')
const Special = require('./special')

const router = new Router()

router
.use('/info', Info.routes(), Info.allowedMethods())
.use('/special', Special.routes(), Special.allowedMethods())


module.exports = router