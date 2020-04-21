const Router = require('@koa/router')
const Detail = require('./routes/detail')

const router = new Router()

router.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router