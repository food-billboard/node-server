const Router = require('@koa/router')
const { verifyTokenToData, UserModel, FriendsModel, dealErr, FRIEND_STATUS, notFound, Params, responseDataDeal, avatarGet, parseData } = require("@src/utils")
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
    "friends.status": FRIEND_STATUS.BLACK
  })
  .select({
    friends: 1
  })
  .populate({
    path: 'friends._id',
    select: {
      username: 1,
      avatar: 1,
      description: 1
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
        black: friends.filter(item => !!item._id).map(a => {
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
.put('/', async (ctx) => {
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
    friends: { 
      $elemMatch: { 
        status: FRIEND_STATUS.NORMAL,
        _id
      } 
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(_ => {
    return FriendsModel.updateOne({
      user: id,
      friends: { 
        $elemMatch: { 
          _id
        } 
      }
    }, {
      $set: { 
        "friends.$.status": FRIEND_STATUS.BLACK
      }
    })
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
        status: FRIEND_STATUS.BLACK,
        _id
      } 
    }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(() => {
    return FriendsModel.updateOne({
      user: ObjectId(id),
      friends: { 
        $elemMatch: { 
          _id
        } 
      }
    }, {
      $set: { 
        "friends.$.status": FRIEND_STATUS.NORMAL
      }
    })
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