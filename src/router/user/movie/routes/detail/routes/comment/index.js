const Router = require('@koa/router')
const List = require('./list')
const Detail = require('./detail')

const router = new Router()

router.use('/list', List.routes(), List.allowedMethods())
router.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router