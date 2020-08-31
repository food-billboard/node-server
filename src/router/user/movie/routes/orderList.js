const Router = require('@koa/router')
const orderList = require('../orderList')
const { responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {

  responseDataDeal({
    ctx,
    data: orderList,
    needCache: false
  })

})

module.exports = router