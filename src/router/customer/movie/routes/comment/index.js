const Router = require('@koa/router')
const Like = require('./like')

const router = new Router()

router.use('/like', Like.routes(), Like.allowedMethods())

module.exports = router