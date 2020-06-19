const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const { Types: { ObjectId } } = require("mongoose")
const { UserModel, dealErr, Params } = require("@src/utils")

const router = new Router()

router
.get('/', async (ctx) => {
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

  let res = {}
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      function(data) {
        return ObjectId(data)
      }
    ]
  })
  const data = await UserModel.findOne({
    _id
  })
  .select({
    username: 1,
    avatar: 1,
    hot: 1,
    fans:1,
    attentions: 1,
    createdAt: 1,
    updatedAt: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'not found', status: 404 })
    const { avatar, attentions, fans, ...nextData } = data
    return {
      ...nextData,
      attentions: attentions.length,
      fans: fans.length,
      avatar: avatar ? avatar.src : null
    }
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res ={
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
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/fans', Fans.routes(), Fans.allowedMethods())

module.exports = router
