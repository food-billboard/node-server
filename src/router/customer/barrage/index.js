const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, BarrageModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//token验证
.use(async (ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  if(token) {
    await next()
  }else {
    ctx.status = 401
    ctx.body = JSON.stringify({
      success: false,
      res: null
    })
  }
})
.get('/', async(ctx) => {
  //参数验证
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({ ...check.res })
    return
  }

  const [ timeStart, process, _id ] = Params.sanitizers(ctx.query, {
    name: 'timeStart',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'process',
    _default: 1000 * 60 * 2,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  let mineId

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    mineId = data._id
    return BarrageModel.find({
      origin: _id,
      sort: {
        time_line: 1
      },
      ...(timeStart >= 0 ? { 
        $gt: { time_line: timeStart },
        ...(process >= 0 ? { $lt: { time_line: process + timeStart } } : {})
      } : {})
    })
  })
  .select({
    user: 0,
    origin:0,
  })
  .limit(1000)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return data.map(item => {
      const { _doc: { like_users, ...nextItem } } = item
      return {
        ...nextItem,
        hot: like_users.length,
        like: !!~like_users.indexOf(mineId)
      }
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
      res: {
        data
      }
    }
  }
  ctx.body = JSON.stringify(res)

})
//发送弹幕
.put('/', async(ctx) => {
  //参数验证
  const check = Params.body(ctx, {
    name: '_id',
    type: ['isMongoId']
  },
  {
    name: 'content',
    type: ['isEmpty']
  },
  {
    name: 'time',
    type: ['isInt'],
    validator: [
      (data) => data >= 0
    ]
  })
  if(check) {
    ctx.body = JSON.stringify({ ...check.res })
    return
  }

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await Promise.all([
    MovieModel.findOne({
      _id
    })
    .select({_id: 1})
    .exec()
    .then(data => !!data)
    .then(notFound),
    UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._doc._id)
  ])
  .then(([_, user]) => {
    const newModel = new BarrageModel({
      origin: _id,
      user,
      like_users: [],
      time_line: {
        type: Number,
        required: true
      },
      content
    })
    return newModel.save()
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
//点赞
.post('/like', async(ctx) => {
  //参数验证
  const check = Params.body(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({ ...check.res })
    return
  }

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(userId => {
    return BarrageModel.updateOne({
      _id,
      like_users: { $nin: [userId] }
    }, {
      $push: { like_users: userId }
    })
  })
  .exec()
  .then(data => {
    if(data && data.nModified === 0) return Promise.reject({ errMsg: 'unknown error', status: 500 })
    return null
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
//取消点赞
.delete('/like', async(ctx) => {
  //参数验证
  const check = Params.body(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({ ...check.res })
    return
  }

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(userId => {
    return BarrageModel.updateOne({
      _id,
      like_users: { $in: [userId] }
    }, {
      $pull: { like_users: userId }
    })
  })
  .exec()
  .then(data => {
    if(data && data.nModified === 0) return Promise.reject({ errMsg: 'unknown error', status: 500 })
    return null
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