const Router = require('@koa/router')
const Video = require('./video')

const router = new Router()

router
.use('/video', Video.routes(), Video.allowedMethods())

module.exports = router