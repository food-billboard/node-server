const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const { MongoDB, withTry, verifyTokenToData, middlewareVerifyToken } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router
.use(middlewareVerifyToken)
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  const { mobile } = token
  const [, info] = await withTry(mongo.findOne)("_user_", {
    mobile
  }, {
    mobile: 1,
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attention: 1,
    create_time: 1,
    status: 1
  })
  if(!info) {
    ctx.status = 401
    res = {
      success: false,
      res: null
    }
  }else {
    const { fans, attentions, ...nextInfo } = info
    res = {
      success: true,
      res: {
        data: {
          fans: fans.length,
          attentions: attentions.length,
          ...nextInfo
        }
      }
    }
  }
})
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/fans', Fans.routes(), Fans.allowedMethods())


module.exports = router