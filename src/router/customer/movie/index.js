const Router = require('@koa/router')
const {
  Comment,
  Detail,
  Rate,
  Store
} = require('./routes')

const router = new Router()

router.use('/comment', Comment.routes(), Comment.allowedMethods())
router.use('/detail', Detail.routes(), Detail.allowedMethods())
router.use('/rate', Rate.routes(), Rate.allowedMethods())
router.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router