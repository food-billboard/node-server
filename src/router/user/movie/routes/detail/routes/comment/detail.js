const Router = require('@koa/router')

const router = new Router()

// params: { currPage: 当前页, pageSize: 数量, id: 评论id }

router.get('/', async (ctx) => {
  ctx.body = '评论详情'
})

module.exports = router