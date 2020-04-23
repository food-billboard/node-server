const Router = require('@koa/router')

const router = new Router()

router.get('/', async (ctx) => {
  ctx.body = '导演'
})

module.exports = router