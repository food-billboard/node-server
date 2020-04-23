const Router = require('@koa/router')

const router = new Router()

// 获取关注params: { id: 用户id, currpage: 当前页, pageSize: 数量 }
// 关注params: { id: 用户id, user: 个人id }

router
.get('/', async (ctx) => {
  ctx.body = '获取关注'
})
.put('/', async (ctx) => {
  ctx.body = '关注'
})

module.exports = router