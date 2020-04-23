const Router = require('@koa/router')

const router = new Router()

// params: { content: 关键字 }

router.get('/', async (ctx) => {
  ctx.body = '联想'
})

module.exports = router