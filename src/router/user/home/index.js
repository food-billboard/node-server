const Router = require('@koa/router')
const Daily = require('./routes/daily')
const Hot = require('./routes/hot')
const Notice = require('./routes/notice')
const Rank = require('./routes/rank')
const Special = require('./routes/special')
const Swiper = require('./routes/swiper')

const router = new Router()

router.use('/daily', Daily.routes(), Daily.allowedMethods())
router.use('/hot', Hot.routes(), Hot.allowedMethods())
router.use('/notice', Notice.routes(), Notice.allowedMethods())
router.use('/rank', Rank.routes(), Rank.allowedMethods())
router.use('/special', Special.routes(), Special.allowedMethods())
router.use('/swiper', Swiper.routes(), Swiper.allowedMethods())

module.exports = router