const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const { Types: { ObjectId } } = require("mongoose")
const { UserModel, dealErr, paramsCheck } = require("@src/utils")


const router = new Router()

router
.use(paramsCheck.get(['_id']))
.get('/', async (ctx) => {
  let res = {}
  const { _id } = ctx.query
  const objectId = ObjectId(_id)
  const data = await UserModel.findOne({
    _id: objectId
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
  .populate({
    path: 'avatar',
    select: {
      _id: 0,
      src: 1
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'not found', status: 404 })
    const { avatar: { src }, attentions, fans, ...nextData } = data
    return {
      ...nextData,
      attentions: attentions.length,
      fans: fans.length,
      avatar: src
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
