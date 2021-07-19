const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal, avatarGet } = require('@src/utils')

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
      responseDataDeal({
        ctx,
        data: {
          err: true,
          res: null
        }
      })
    }else if(!token && _id) {
      ctx.status = 302
      return ctx.redirect(newUrl)
    }else {
      ctx.status = 403
      responseDataDeal({
        ctx,
        data: {
          err: true,
          res: null
        }
      })
    }
  }else {
    ctx.status = 405
    responseDataDeal({
      ctx,
      data: {
        err: true,
        res: null
      }
    })
  }
})
//个人信息
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)

  const { id } = token
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attentions: 1,
    createdAt: 1,
    updatedAt: 1,
    description: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { fans, avatar, attentions, ...nextData } = data 
    return {
      data: {
        ...nextData,
        fans: fans.length,
        avatar: avatarGet(avatar),
        attentions: attentions.length,
        like: fans.some(item => item._id == id)
      }
    }
  })
  .catch(dealErr(ctx))

  if(!data) {
    ctx.status = 401
    data = {
      err: true,
      res: {
        errMsg: 'not authritarian'
      }
    }
  }

  responseDataDeal({
    ctx,
    data, 
  })

})
.use('/fans', Fans.routes(), Fans.allowedMethods())
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())

module.exports = router