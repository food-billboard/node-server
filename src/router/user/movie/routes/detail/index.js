const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')

const router = new Router()

router.use('/comment', Comment.routes(), Comment.allowedMethods())
router.use('/simple', Simple.routes(), Simple.allowedMethods())

module.exports = router