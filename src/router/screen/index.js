const Router = require('@koa/router')
const Index = require('./router')
const Detail = require('./router/detail')
const Preview = require('./router/preview')
const Share = require('./router/share')
const Enable = require('./router/enable')
const Copy = require('./router/copy')
const Model = require('./router/model')
const { loginAuthorization } = require('@src/utils')

const router = new Router()

router
.use('/list', Index.routes(), Index.allowedMethods())
.use('/model', Model.routes(), Model.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())
.use('/share', Share.routes(), Share.allowedMethods())
//登录判断
.use(loginAuthorization())
.use('/preview', Preview.routes(), Preview.allowedMethods())
.use('/enable', Enable.routes(), Enable.allowedMethods())
.use('/copy', Copy.routes(), Copy.allowedMethods())

module.exports = router