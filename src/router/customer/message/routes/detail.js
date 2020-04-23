const Router = require('@koa/router')

const router = new Router()

// params: { id: 消息id }

router.get('/', async (ctx) => {
  ctx.body = '详情'
})

module.exports = router