const Router = require('@koa/router')
const { UserModel, MovieModel, verifyTokenToData, dealErr, notFound, Params } = require("@src/utils")
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
  }
  const check = Params[_method](ctx, {
    name: '_id',
    type: [ 'isMongoId' ]
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
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
  const { mobile } = token
  let res

  const data = await UserModel.updateOne({
    mobile: Number(mobile),
    store: { $ne: _id }
  }, {
    $push: { store: _id }
  })
  .then(_ => {
    return MovieModel.updateOne({
      _id
    }, {
      $inc: { hot: 1 }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.delete('/', async(ctx) => {
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [ 
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const data = await UserModel.updateOne({
    mobile: Number(mobile),
    store: { $in: [_id] }
  }, {
    $pull: { store: _id }
  })
  .exec()
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'no store', status: 403 })
    return MovieModel.updateOne({
      _id
    }, {
      $inc: { hot: -1 }
    })
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router