const Router = require('@koa/router')
const { verifyTokenToData, UserModel, CommentModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {

  const { method } = ctx
  let _method
  let _id
  if(method.toLowerCase() === 'put') {
    _method = 'body'
  }else if(method.toLowerCase() === 'delete') {
    _method = 'query'
  }else {
    const data = dealErr(ctx)({ errMsg: 'request method is not allow', status: 405 })
    responseDataDeal({
      data,
      ctx
    })
    return
  }

  if(_method == 'body') {
    _id = ctx.request.body._id
  }else {
    _id = ctx.query._id
  }

  const data = await CommentModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .catch(dealErr(ctx))

  if(data && data.errMsg) {
    responseDataDeal({
      ctx,
      data
    })  
    return
  }

  return await next()
})
.put('/', async (ctx) => {
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await CommentModel.findOneAndUpdate({
    _id,
    like_person: { $nin: [ ObjectId(id) ] } 
  }, {
    $inc: { total_like: 1 },
    $addToSet: { like_person: ObjectId(id) }
  })
  .select({
    _id: 0,
    user_info: 1
  })
  .exec()
  .then(data => !!data && data.user_info)
  .then(data => {
    if(!data) {
      ctx.status = 403
      return Promise.reject({ err: true, errMsg: 'already liked before', status: 403 })
    }
    return data
  })
  .then(userId => {
    return UserModel.updateOne({
      _id: userId
    }, {
      $inc: { hot: 1 }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/', async(ctx) => {
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await CommentModel.findOneAndUpdate({
    _id,
    like_person: { $in: [ ObjectId(id) ] } 
  }, {
    $inc: { total_like: -1 },
    $pull: { like_person: ObjectId(id) }
  })
  .select({
    _id: 0,
    user_info: 1
  })
  .exec()
  .then(data => !!data && data.user_info)
  .then(data => {
    if(!data) {
      ctx.status = 403
      return Promise.reject({ err: true, errMsg: 'not liked before', status: 403 })
    }
    return data
  })
  .then(userId => {
    return UserModel.updateOne({
      _id: userId
    }, {
      $inc: { hot: - 1 }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router