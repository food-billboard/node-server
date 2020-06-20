const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const Feedback = require('./routes/feedback')
const Info = require('./routes/info')
const { verifyTokenToData, UserModel, dealErr, notFound, Params } = require('@src/utils')

const router = new Router()

router
.use(async (ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { _id } = ctx.query
  const { url } = ctx.request
  const newUrl = `/api/customer/user/${url.split('manage')[1]}`
  if(token) {
    await next()
  }else {
    ctx.status = 401
    if(_id) {
      ctx.redirect(newUrl)
    }else {
      ctx.body = JSON.stringify({
        success: false,
        res: null
      })
    }
  }
})
//个人信息
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    mobile: 1,
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attentions: 1,
    create_time: 1,
    status: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
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
      const { fans, attentions, avatar, ...nextData } = data
      res = {
        success: true,
        res: {
          data: {
            fans: fans.length,
            attentions: attentions.length,
            avatar: avatar ? avatar.src : null,
            ...nextData
          }
        }
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/fans', Fans.routes(), Fans.allowedMethods())
.use('/feedback', Feedback.routes(), Feedback.allowedMethods())
.use('/info', Info.routes(), Info.allowedMethods())


module.exports = router