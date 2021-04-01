const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, BarrageModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')
const { merge } = require('lodash')

const router = new Router()

router
//token验证
.use(async (ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  if(token) {
    await next()
  }else {
    ctx.status = 401
    responseDataDeal({
      ctx,
      data: {
        err: true,
        res: {
          errMsg: 'not authentication'
        }
      }
    })
  }
})
.get('/', async(ctx) => {
  //参数验证
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) return

  const [ timeStart, process, _id ] = Params.sanitizers(ctx.query, {
    name: 'timeStart',
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'process',
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
  const { id } = token

  let query = {
    origin: _id,
  }
  if(timeStart >= 0) {
    query = merge(query, { time_line: { $gt: timeStart } })
  }
  if(process >= 0) {
    query = merge(query, { time_line: { ...query.time_line || {}, $lt: process + timeStart } })
  }

  const data = await BarrageModel.find(query)
  .select({
    like_users:1,
    content: 1,
    time_line: 1,
    _id: 1
  })
  .limit(1000)
  .sort({
    time_line: 1
  })
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return {
      data: data.map(item => {
        const { _doc: { like_users, ...nextItem } } = item
        return {
          ...nextItem,
          hot: like_users.length,
          like: !!~like_users.indexOf(ObjectId(id))
        }
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

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
    type: ['isEmpty'],
    validator: [
      data => typeof data === 'string' && data.length > 0
    ]
  },
  {
    name: 'time',
    type: ['isInt'],
    validator: [
      (data) => data >= 0
    ]
  })
  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const [ _id, content, time ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'content',
    sanitizers: [
      data => data
    ]
  }, {
    name: 'time',
    _default: 0,
    type: ['toInt']
  })

  const data = await MovieModel.findOne({
    _id
  })
  .select({_id: 1})
  .exec()
  .then(data => !!data)
  .then(notFound)
  .then(_ => {
    const newModel = new BarrageModel({
      origin: _id,
      user: ObjectId(id),
      like_users: [],
      time_line: time,
      content
    })
    return newModel.save()
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//点赞
.post('/like', async(ctx) => {
  //参数验证
  const check = Params.body(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await BarrageModel.findOneAndUpdate({
    _id,
    like_users: { $nin: [ ObjectId(id) ] }
  }, {
    $push: { like_users: ObjectId(id) }
  })
  .select({
    user: 1,
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { user, _id } = data
    UserModel.updateOne({
      _id: user
    }, {
      $push: { hot_history: { _id: ObjectId(id), timestamps: Date.now(), origin_type: 'barrage', origin_id: _id } },
      $inc: { hot: 1 }
    })

    return {}
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//取消点赞
.delete('/like', async(ctx) => {
  //参数验证
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await BarrageModel.findOneAndUpdate({
    origin: _id,
    like_users: { $in: [ ObjectId(id) ] }
  }, {
    $pull: { like_users: ObjectId(id) }
  })
  .select({
    user: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { user, _id } = data
    UserModel.updateOne({
      _id: user
    }, {
      $pull: { hot_history: { origin_type: 'barrage', origin_id: _id, } },
      $inc: { hot: -1 }
    })
    return {}
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router