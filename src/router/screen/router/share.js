const Router = require('@koa/router')
const { 
  verifyTokenToData, 
  dealErr, 
  Params, 
  responseDataDeal, 
  ScreenModal, 
  getClient, 
  notFound, 
  MEDIA_AUTH, 
  loginAuthorization,
  setCookie,
} = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const { SHARE_COOKIE_KEY, getUserAgent } = require('./constants')

const router = new Router()

// 1. 设置分享，并设置参数，后台生成url地址
// 2. 前端访问页面，调用接口获取url地址信息
// 3. 后端判断url是否过期，过期则返回错误的信息
// 4. 前端获取url分享的配置，如果存在密码则输入密码并调佣接口判断
// 5. 前端定时请求接口验证其时效性

router
// 验证url地址是否过期
.get('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id } = ctx.query

  const redisClient = getClient()

  const data = await redisClient.get(_id)
  .then(data => {
    return {
      data: !!data 
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
// 验证信息
.get('/valid', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { _id } = ctx.query

  const redisClient = getClient()

  const data = await redisClient.get(_id)
  .then(notFound)
  .then(data => {
    const { auth, password } = data 
    return {
      data: {
        auth,
        password: !!password
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
// 验证
.post('/valid', async (ctx) => {
  const check = Params.body(ctx, {
    name: 'password',
    validator: [
      data => !!data
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const { password, _id } = ctx.request.body

  const redisClient = getClient()

  const data = await redisClient.get(_id)
  .then(notFound)
  .then(data => {
    const { password: realPassword } = data 
    const isValid = password === realPassword

    // * 设置分享cookie用于查询大屏详情时无须登录信息
    setCookie(ctx, {
      parse: false,
      key: SHARE_COOKIE_KEY,
      value: getUserAgent(ctx)
    })

    return {
      data: isValid
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })
})
.use(loginAuthorization())
// 分享
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'auth',
    validator: [
      data => !!MEDIA_AUTH[data]
    ]
  }, {
    name: 'time',
    validator: [
      data => typeof data === 'number' && data > 0 
    ]
  })

  if(check) return 

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { auth, time, password, _id } = ctx.request.body

  const data = await ScreenModal.findOne({
    _id: ObjectId(_id),
    user: ObjectId(id),
    enable: true 
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(() => {
  
    const redisClient = getClient() 

    return new Promise((resolve, reject) => {
      const jsonString = JSON.stringify({
        password,
        auth,
        time,
        _id 
      })
      redisClient.setex(_id, time / 1000, jsonString, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(id)
        }
      })
    })

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
// 取消分享
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

  const data = await ScreenModal.findOne({
    _id: ObjectId(_id),
    user: ObjectId(id),
    enable: true 
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(() => {
  
    const redisClient = getClient() 

    return redisClient.del(_id)

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})

module.exports = router