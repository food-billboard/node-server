const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const { verifyTokenToData, UserModel, dealErr, notFound, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async (ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { method, url } = ctx.request
  const { _id } = ctx.query
  const pathUrl = url.split("user")[1].split('?')[0]
  const newUrl = `/api/user/customer${url.split('user')[1]}`
  if(method.toLocaleLowerCase() == 'get') {
    if(token && _id) {
      if(!['', '/comment'].includes(pathUrl)) {
        return ctx.redirect(newUrl)
      }else {
        await next()
      }
    }else if(token && !_id) {
      ctx.status = 400
      ctx.body = JSON.stringify({
        success: false,
        res: null
      })
    }else if(!token && _id) {
      ctx.status = 401
      return ctx.redirect(newUrl)
    }else {
      ctx.status = 403
      ctx.body = JSON.stringify({
        success: false,
        res: null
      })
    }
  }else {
    ctx.status = 405
    ctx.body = JSON.stringify({
      success: false,
      res: null
    })
  }
})
//个人信息
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  const { mobile } = token
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await UserModel.find({
    $or: [
      {
        mobile: Number(mobile),
      },
      {
        _id: ObjectId(_id)
      }
    ]
  })
  .select({
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attentions: 1,
    createdAt: 1,
    updatedAt: 1,
  })
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    let result = {}
    let mine
    let fans
    data.forEach(d => {
      const { _doc: { _id:id, avatar, ...nextD } } = d 
      if(id.equals(_id)) {
        const { fans:userFans, attentions } = nextD
        result = {
          ...result,
          ...nextD,
          _id: id,
          avatar: avatar ? avatar.src : null,
          fans: userFans.length,
          attentions: attentions.length,
          like: false,
        }
        fans = [...userFans]
      }else {
        mine = id
      }
    })

    if(mine && fans.some(f => f.equals(mine))) result.like = true
    return result
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    if(!data) {
      ctx.status = 401
      res = {
        success: false,
        res: {
          errMsg: '登录过期'
        }
      }
    }else {
      res = {
        success: true,
        res: {
          data
        }
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.use('/fans', Fans.routes(), Fans.allowedMethods())
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())


module.exports = router