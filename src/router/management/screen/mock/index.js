const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, ScreenMockModel, notFound, loginAuthorization, getCookie, SCREEN_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {

  const [  ] = Params.sanitizers(ctx.query)

  const data = await ScreenMockModel.aggregate([ ])
  .then(data => {
    return {
      data
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.delete('/', async (ctx) => {

  const data = await Promise.resolve()
  .then(data => {
    return {
      data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.post('/', async (ctx) => {

  const data = await Promise.resolve()
  .then(data => {
    return {
      data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.put('/', async (ctx) => {

  const data = await Promise.resolve()
  .then(data => {
    return {
      data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})


module.exports = router