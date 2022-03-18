const Router = require('@koa/router')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenModal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
// 启用
.put('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { _id } = ctx.request.body

  const data = await ScreenModal.updateOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  }, {
    enable: true 
  })
  .then(data => {

    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })

    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
// 禁用
.delete('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { _id } = ctx.query

  const data = await ScreenModal.updateOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  }, {
    enable: false  
  })
  .then(data => {

    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'forbidden', status: 403 })

    return {
      data: _id 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})

module.exports = router