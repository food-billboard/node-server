const Router = require('@koa/router')
const home = require('./test')

const router = new Router()

router.use('/', home.routes(), home.allowedMethods())

module.exports = router