const Router = require('@koa/router')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenModal, setCookie, getCookie, notFound, fileEncoded } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { getUserAgent } = require('./constants')

const PREVIEW_COOKIE_NAME = 'preview_valid'

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
    // 设置cookie
    const cookieValue = getUserAgent(ctx) + `_${_id}`
    const cookieName = PREVIEW_COOKIE_NAME

    setCookie(ctx, {  
      key: cookieName,
      value: cookieValue,
      parse: false,
      type: 'set',
    })

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

    const cookieValue = getUserAgent(ctx) + `_${_id}`
    const cookieName = PREVIEW_COOKIE_NAME

    const cookie = getCookie(ctx, cookieName)

    return {
      data: cookie === cookieValue
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