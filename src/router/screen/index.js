const Router = require('@koa/router')
const Index = require('./router')
const Preview = require('./router/preview')
const Share = require('./router/share')
const Enable = require('./router/enable')
const { loginAuthorization } = require('@src/utils')

const router = new Router()

router
//登录判断
.use(loginAuthorization())
.use('/', Index.routes(), Index.allowedMethods())
.use('/preview', Preview.routes(), Preview.allowedMethods())
.use('/share', Share.routes(), Share.allowedMethods())
.use('/enable', Enable.routes(), Enable.allowedMethods())

module.exports = router