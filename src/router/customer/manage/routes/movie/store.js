const Router = require('@koa/router')

const router = new Router()

// { id: 用户id, currPage: 当前页, pageSize: 数量 }

router.get('/', async (ctx) => {
  ctx.body = '获取收藏'
})

module.exports = router