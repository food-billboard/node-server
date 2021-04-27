const Router = require('@koa/router')
const { UserModel, MovieModel, verifyTokenToData, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require("mongoose")

const router = new Router()

router
.use(async(ctx, next) => {

  const { method } = ctx
  let _method

  if(method.toLowerCase() === 'put') {
    _method = 'body'
  }else if(method.toLowerCase() === 'delete') {
    _method = 'query'
  }else {
    const data = dealErr(ctx)({ errMsg: 'request method is not allow', status: 415 })
    responseDataDeal({
      ctx,
      data
    })
    return
  }

  const check = Params[_method](ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return
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

  const data = await MovieModel.findOne({
    _id
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => data._id)
  .then(_id => {
    return UserModel.updateOne({
      _id: ObjectId(id),
      "store._id": { $ne: _id }
    }, {
      $push: { store: { _id, timestamps: Date.now() } }
    })
  })
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'already store', status: 403 })
    return MovieModel.updateOne({
      _id
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

  const data = await MovieModel.findOne({
    _id
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => data._id)
  .then(_id => {
    return UserModel.updateOne({
      _id: ObjectId(id),
      "store._id": { $in: [_id] }
    }, {
      $pull: { store: { _id } }
    })
  })
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'no store', status: 403 })
    return MovieModel.updateOne({
      _id
    }, {
      $inc: { hot: -1 }
    })
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router