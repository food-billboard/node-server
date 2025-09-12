const Router = require('@koa/router')
const Media = require('./routes')
const Valid = require('./routes/valid')
const WhiteList = require('./routes/white_list')

const router = new Router()

router
.use('/', Media.routes(), Media.allowedMethods())
.use('/valid', Valid.routes(), Valid.allowedMethods())
.use('/person', WhiteList.routes(), WhiteList.allowedMethods())


module.exports = router