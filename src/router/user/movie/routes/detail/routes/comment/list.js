const Router = require('@koa/router')

const router = new Router()

// params: { currPage: 当前页, pageSize: 数量, id: 电影id }

router.get('/', async (ctx) => {
  ctx.body = '评论列表'
})

module.exports = router