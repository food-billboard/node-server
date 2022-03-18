const Router = require('@koa/router')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenModal, notFound } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

// 1. 点击预览后台根据用户ua生成url地址
// 2. 后台将ua写入cookie中
// 2. 前端访问页面，首先调用接口查看是否可访问

router
.post('/', async (ctx) => {

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

  const data = await ScreenModal.findOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {

    return {
      
    }

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.get('/valid', async (ctx) => {
  
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { _id } = ctx.query

  const data = await ScreenModal.findOne({
    _id: ObjectId(_id),
    user: ObjectId(id)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {

    return {
      data: true 
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