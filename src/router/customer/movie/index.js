const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Detail = require('./routes/detail')
const Rate = require('./routes/rate')
const Store = require('./routes/store')

const router = new Router()

router.use('/comment', Comment.routes(), Comment.allowedMethods())
router.use('/detail', Detail.routes(), Detail.allowedMethods())
router.use('/rate', Rate.routes(), Rate.allowedMethods())
router.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router