const Router = require('@koa/router')

const router = new Router()

// params: { count: 数量 } 

router.get('/', async (ctx) => {
  ctx.body="分类信息"
})

module.exports = router