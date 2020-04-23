const Router = require('@koa/router')

const router = new Router()

// ata: { id: 电影id, user: 个人id, value: 分数 }

router.put('/', async (ctx) => {
  ctx.body = '评分'
})

module.exports = router