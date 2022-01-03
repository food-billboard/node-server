const Router = require('@koa/router')
const Classify = require('./routes/classify')
const Rank = require('./routes/rank')
const Detail = require('./routes/detail')
const Search = require('./routes/search')
const District = require('./routes/district')
const Actor = require('./routes/actor')
const Director = require('./routes/director')
const Language = require('./routes/language')
const OrderList = require('./routes/orderList')
const Special = require('./routes/special')

const router = new Router()

router
.use('/classify', Classify.routes(), Classify.allowedMethods())
.use('/rank', Rank.routes(), Rank.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())
.use('/search', Search.routes(), Search.allowedMethods())
.use('/district', District.routes(), District.allowedMethods())
.use('/actor', Actor.routes(), Actor.allowedMethods())
.use('/director', Director.routes(), Director.allowedMethods())
.use('/language', Language.routes(), Language.allowedMethods())
.use('/order', OrderList.routes(), OrderList.allowedMethods())
.use('/special', Special.routes(), Special.allowedMethods())

module.exports = router