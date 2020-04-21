const Router = require('@koa/router')
const Classify = require('./routes/classify')
const Rank = require('./routes/rank')
const Detail = require('./routes/detail')
const Search = require('./routes/search')

const router = new Router()

router.use('/classify', Classify.routes(), Classify.allowedMethods())
router.use('/rank', Rank.routes(), Rank.allowedMethods())
router.use('/detail', Detail.routes(), Detail.allowedMethods())
router.use('/search', Search.routes(), Search.allowedMethods())

module.exports = router