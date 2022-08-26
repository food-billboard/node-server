const Router = require('@koa/router')
const Weather = require('./weather')

const router = new Router()

router
.use('/weather', Weather.routes(), Weather.allowedMethods())

module.exports = router