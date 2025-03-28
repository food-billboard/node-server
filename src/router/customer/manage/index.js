const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const Feedback = require('./routes/feedback')
const Black = require('./routes/black')
const Friends = require('./routes/friends')
const Info = require('./routes/info')
const { verifyTokenToData, UserModel, dealErr, notFound, responseDataDeal, avatarGet, coverLoginCookie } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

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
  }
})
//个人信息
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
  })
  .select({
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attentions: 1,
    createdAt: 1,
    updatedAt: 1,
    friends: 1,
    friend_id: 1,
    email: 1,
    mobile: 1,
    description: 1,
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { fans, attentions, avatar, ...nextData } = data
  
    //重置默认的koa状态码
    ctx.status = 200
    coverLoginCookie(ctx)

    return {
      data: {
        ...nextData,
        fans: fans.length,
        avatar: avatarGet(avatar),
        attentions: attentions.length
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.get('/token', async (ctx) => {

  const [, token] = verifyTokenToData(ctx, true)

  responseDataDeal({
    ctx,
    data: {
      data: token
    }
  })

})
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/fans', Fans.routes(), Fans.allowedMethods())
.use('/feedback', Feedback.routes(), Feedback.allowedMethods())
.use('/info', Info.routes(), Info.allowedMethods())
.use('/black', Black.routes(), Black.allowedMethods())
.use('/friends', Friends.routes(), Friends.allowedMethods())

module.exports = router