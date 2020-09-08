const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params } = require("@src/utils")
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
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  return await next()
})
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
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
  const { mobile } = token
  let res

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    attentions: 1
  })
  .populate({
    path: 'attentions',
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
      attentions: attentions.map(a => {
        const { _doc: { avatar, ...nextA } } = a
        return {
          ...nextA,
          avatar: avatar ? avatar.src : null,
        }
      })
    }
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
.put('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { mobile } = token
  let res

  const data = await Promise.all([
    UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec(),
    UserModel.findOne({
      _id: ObjectId(_id)
    })
    .select({
      _id: 1
    })
    .exec()
  ])
  .then(([mine, user]) => {
    return Promise.all([
      !!mine && mine._id,
      !!user && user._id
    ])
  })
  .then(([mine, user]) => {
    return Promise.all([
      UserModel.updateOne({
        mobile: Number(mobile),
        attentions: { $nin: [ ObjectId(user) ] }
      }, {
        $push: { attentions: ObjectId(user) }
      }),
      UserModel.updateOne({
        _id: user,
        fans: { $nin: [ mine ] }
      }, {
        $push: { fans: mine }
      }),
    ])
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
  const [, token] = verifyTokenToData(ctx)
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { mobile } = token
  let res

  const data = await Promise.all([
    UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec(),
    UserModel.findOne({
      _id: ObjectId(_id)
    })
    .select({
      _id: 1
    })
    .exec()
  ])
  .then(([mine, user]) => {
    return Promise.all([
      !!mine && mine._id,
      !!user && user._id
    ])
  })
  .then(([mine, user]) => {
    return Promise.all([
      UserModel.updateOne({
        mobile: Number(mobile)
      }, {
        $pull: { attentions: ObjectId(user) }
      }),
      UserModel.updateOne({
        _id: user
      }, {
        $pull: { fans: mine }
      }),
    ])
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: false,
      res: null
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router