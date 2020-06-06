const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const { Types: { ObjectId } } = require("mongoose")
const { UserModel, dealErr } = require("@src/utils")


const router = new Router()

router
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
    createAt: 1,
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  if(data && !data.err) {
    const { _doc: { fans, attentions, ...nextData } } = data
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
  }else {
    res = {
      ...data.res
    }
  }
  ctx.body = JSON.stringify(res)
})
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/fans', Fans.routes(), Fans.allowedMethods())

module.exports = router
