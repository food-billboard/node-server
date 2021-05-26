const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, RoomModel, dealErr, Params, responseDataDeal, notFound } = require('@src/utils')

const router = new Router()

router 
.get('/', async(ctx) => {

})
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  if(!token) {
    const data = dealErr(ctx)({
      errMsg: 'not authorization',
      status: 401
    })
    responseDataDeal({
      data,
      ctx,
      needCache: false 
    })
    return 
  }
  return await next()
})
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const [ id ] = token
  let method = ctx.request.method.toLowerCase()
  let filterPos 
  let body 
  try {
    if(method === 'delete') {
      filterPos = 'query'
      body = ctx.query
    }else {
      filterPos = 'body'
      body = ctx.request.body
    }
  }catch(err) {}
  const check = Params[filterPos](ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  }, {
    name: 'members',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item))
    ]
  })
  if(check) return 

  const [ _id ] = Params.sanitizers(body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await RoomModel.findOne({
    _id
  })
  .select({
    create_user: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { create_user } = data 
    if(create_user == id) return null 
    return Promise.reject({
      errMsg: 'forbidden',
      status: 403
    })
  })
  .catch(dealErr(ctx))

  if(!data) return await next() 
  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})
.delete('/', async(ctx) => {
  const [ _id, members ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'memebers',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = await RoomModel.updateOne({
    _id,
  }, {
    $pullAll: {
      "members.user": members
    }
  })
  .then(_ => {
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
.put('/', async(ctx) => {
  const [ _id, members ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'memebers',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item))
    ]
  })

  const data = await RoomModel.updateOne({
    _id,
  }, {
    $pullAll: {
      "members.user": members
    }
  })
  .then(_ => {
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