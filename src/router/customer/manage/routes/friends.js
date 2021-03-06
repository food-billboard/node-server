const Router = require('@koa/router')
const { verifyTokenToData, UserModel, FriendsModel, FRIEND_STATUS, dealErr, notFound, Params, responseDataDeal, avatarGet, parseData } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async(ctx, next) => {
  const { method } = ctx
  if(method.toLowerCase() === 'get') return await next()
  let _method 
  if(method.toLowerCase() === 'post') {
    _method = 'body'
  }else if(method.toLowerCase() === 'delete') {
    _method = 'query'
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
.get('/', async (ctx) => {
  
  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : 30
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await FriendsModel.findOne({
    user: ObjectId(id),
    "friends.status": FRIEND_STATUS.NORMAL
  })
  .select({
    friends: 1
  })
  .populate({
    path: 'friends._id',
    select: {
      username: 1,
      avatar: 1
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage
    }
  })
  .exec()
  .then(parseData)
  .then(data => {
    const { friends=[] } = data || {}
    return {
      data: {
        ...data,
        friends: friends.filter(item => !!item._id).map(a => {
          const { _id: { avatar, ...nextData } } = a
          return {
            ...nextData,
            avatar: avatarGet(avatar),
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
.post('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let { id } = token
  id = ObjectId(id)

  const data = await FriendsModel.findOne({
    user: id,
  })
  .select({
    _id: 1,
    friends: 1
  })
  .exec()
  .then(parseData)
  .then(data => {
    if(!!data) {
      return data.friends.every(item => item._id != _id.toString())
    } 
    return true 
  })
  .then(notFound)
  .then(_ => {
    return Promise.all([
      UserModel.updateOne({
        _id: id,
      }, {
        $inc: { friends: 1 }
      }),
      FriendsModel.updateOne({
        user: id 
      }, {
        $push: { friends: { _id, timestamps: Date.now() } }
      }, {
        upsert: true 
      })
    ])
  })
  .then(_ => ({ data: _id }))
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

  const data = await FriendsModel.findOne({
    user: ObjectId(id),
    friends: { 
      $elemMatch: { 
        _id: _id
      } 
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(() => {
    return Promise.all([
      UserModel.updateOne({
        _id: ObjectId(id)
      }, {
        $inc: { friends: -1 }
      }),
      FriendsModel.updateOne({
        user: ObjectId(id)
      }, {
        $pull: { friends: { _id } }
      })
    ])
  })
  .then(_ => ({ data: _id }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router