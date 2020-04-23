const Router = require('@koa/router')

const router = new Router()

router.get('/', async (ctx) => {
  ctx.body = '演员'
})

module.exports = router