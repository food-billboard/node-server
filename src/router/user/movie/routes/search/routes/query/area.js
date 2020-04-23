const Router = require('@koa/router')

const router = new Router()

router.get('/', async (ctx) => {
  ctx.body = '地区'
})

module.exports = router