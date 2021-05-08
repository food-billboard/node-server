const Router = require('@koa/router')
const { sortList } = require('../orderList')
const { responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {

  ctx.set({
    'Cache-Control': `max-age=${24 * 60 * 60}`
  })

  responseDataDeal({
    ctx,
    data: {
      data: sortList
    },
    needCache: false
  })

})

module.exports = router