const Router = require('@koa/router')
const { verifyTokenToData, UserModel, CommentModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.put('/', async (ctx) => {
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    return CommentModel.findOneAndUpdate({
      _id,
      like_person: { $nin: [id] } 
    }, {
      $inc: { total_like: 1 },
      $addToSet: { like_person: id }
    })
    .select({
      _id: 0,
      user_info: 1
    })
    .exec()
    .then(data => !!data && data.user_info)
    .then(notFound)
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
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    return CommentModel.findOneAndUpdate({
      _id,
      like_person: { $in: [id] } 
    }, {
      $inc: { total_like: -1 },
      $pull: { like_person: id }
    })
    .select({
      _id: 0,
      user_info: 1
    })
    .exec()
    .then(data => !!data && data.user_info)
    .then(notFound)
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