const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const { method } = ctx
  if(method.toLowerCase() === 'get') return await next()
  let _method 
  if(method.toLowerCase() === 'put') {
    _method = 'body'
  }else if(method.toLowerCase() === 'delete') {
    _method = 'query'
  }

  const check = Params[_method](ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) return

  return await next()
})
.get('/', async (ctx) => {
  
  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    attentions: 1,
    updatedAt: 1
  })
  .populate({
    path: 'attentions._id',
    select: {
      username: 1,
      avatar: 1
    },
    options: {
      ...(pageSize >= 0 ? { limit: pageSize } : {}),
      ...((currPage >= 0 && pageSize >= 0) ? { skip: pageSize * currPage } : {})
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { attentions } = data
    return {
      data: {
        ...data,
        attentions: attentions.map(a => {
          const { _doc: { _id: { _doc: { avatar, ...nextData } }, timestamps } } = a
          return {
            ...nextData,
            avatar: avatar ? avatar.src : null,
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.put('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { mobile } = token
  let mineId

  const data = await UserModel.findOne({
    mobile: Number(mobile),
    "attentions._id": { $nin: [ _id ] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(id => {
    mineId = id
    return UserModel.findOne({
      _id,
      "fans._id": { $nin: [ id ] }
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._doc._id)
  })
  .then(notFound)
  .then(_ => {
    return Promise.all([
      UserModel.updateOne({
        mobile: Number(mobile),
        "attentions._id": { $nin: [ _id ] }
      }, {
        $push: { attentions: { _id, timestamps: Date.now() } }
      }),
      UserModel.updateOne({
        _id: _id,
        "fans._id": { $nin: [ mineId ] }
      }, {
        $push: { fans: { _id: mineId, timestamps: Date.now() } }
      }),
    ])
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

  let mineId

  const data = await UserModel.findOne({
    mobile: Number(mobile),
    "attentions._id": { $in: [_id] }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(id => {
    mineId = id
    return UserModel.findOne({
      _id,
      "fans._id": { $in: [ id ] }
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data._doc._id)
  })
  .then(notFound)
  .then((userId) => {
    return Promise.all([
      UserModel.updateOne({
        mobile: Number(mobile)
      }, {
        $pull: { attentions: { _id: userId } }
      }),
      UserModel.updateOne({
        _id: userId
      }, {
        $pull: { fans: { _id: mineId } }
      }),
    ])
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router