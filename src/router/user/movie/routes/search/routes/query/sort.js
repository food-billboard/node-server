const Router = require('@koa/router')

const router = new Router()

router.get('/', async (ctx) => {
  ctx.body = '排序'
})

module.exports = router