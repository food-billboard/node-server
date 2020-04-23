const Router = require('@koa/router')

const router = new Router()

// data: { id: 电影id, user: 个人id }

router.put('/', async (ctx) => {
  ctx.body = '收藏'
})

module.exports = router