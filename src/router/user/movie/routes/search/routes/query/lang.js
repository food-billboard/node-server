const Router = require('@koa/router')

const router = new Router()

router.get('/', async (ctx) => {
  ctx.body = '语言'
})

module.exports = router