const Router = require('@koa/router')
const Statistics = require('./routes/statistics')

const router = new Router()

router
.use('/statistics', Statistics.routes(), Statistics.allowedMethods())

module.exports = router