const Router = require('@koa/router')
const {
  Daily,
  Hot,
  Notice,
  Rank,
  Special,
  Swiper
} = requier('./routes')

const router = new Router()


module.exports = router