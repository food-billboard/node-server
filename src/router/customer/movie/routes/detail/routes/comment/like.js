const Router = require('@koa/router')

const router = new Router()

// params: { id: 评论id, user: 个人id }

router.put('/', async (ctx) => {
  ctx.body = '点赞'
})

module.exports = router