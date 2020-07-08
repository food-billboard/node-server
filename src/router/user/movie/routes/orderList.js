const Router = require('@koa/router')
const orderList = require('../orderList')

const router = new Router()

router.get('/', async(ctx) => {

  ctx.body = JSON.stringify({
    success: true,
    res: {
      data: orderList
    }
  })
})

module.exports = router