const Router = require('@koa/router')
const {
  Classify,
  Rank,
  Detail,
  Search
} = require('./routes')

const router = new Router()

router.use('/classify', Classify.routes(), Classify.allowedMethods())
router.use('/rank', Rank.routes(), Rank.allowedMethods())
router.use('/detail', Detail.routes(), Detail.allowedMethods())
router.use('/search', Search.routes(), Search.allowedMethods())

module.exports = router