const Router = require('@koa/router')
const Daily = require('./routes/daily')
const Hot = require('./routes/hot')
const Notice = require('./routes/notice')
const Rank = require('./routes/rank')
const Special = require('./routes/special')
const Swiper = require('./routes/swiper')

const router = new Router()

router
.use('/daily', Daily.routes(), Daily.allowedMethods())
.use('/hot', Hot.routes(), Hot.allowedMethods())
.use('/notice', Notice.routes(), Notice.allowedMethods())
.use('/rank', Rank.routes(), Rank.allowedMethods())
.use('/special', Special.routes(), Special.allowedMethods())
.use('/swiper', Swiper.routes(), Swiper.allowedMethods())

module.exports = router