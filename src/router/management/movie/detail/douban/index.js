const Router = require('@koa/router')
const { dealErr, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const {  } = require('./utils')

const router = new Router()

router
//收藏
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await Promise.resolve()
  .catch(dealErr(ctx))

  responseDataDeal({
      ctx,
      data,
      needCache: false
  })

})

module.exports = router