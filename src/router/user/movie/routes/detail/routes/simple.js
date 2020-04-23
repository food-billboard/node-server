const Router = require('@koa/router')

const router = new Router()

// params: { id: 电影id }

router.get('/', async (ctx) => {
  ctx.body = '简易头部'
})

module.exports = router