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
  let errMsg
  const { mobile } = token
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      mobile: 1,
      username: 1,
      avatar: 1,
      hot: 1,
      fans:1,
      attention: 1,
      create_time: 1,
      status: 1
    }
  }))
  .catch(err => {
    errMsg = err
    return false
  })
  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
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
      const { fans, attentions, ...nextData } = data
      res = {
        success: true,
        res: {
          data: {
            fans: fans.length,
            attentions: attentions.length,
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


module.exports = router