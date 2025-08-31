const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')
const { Types: { ObjectId } } = require("mongoose")
const { UserModel, dealErr, Params, responseDataDeal, parseData, avatarGet } = require("@src/utils")

const router = new Router()

router
.get('/', async (ctx) => {
  //validate params
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
      function(data) {
        return ObjectId(data)
      }
    ]
  })

  //database
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
    updatedAt: 1,
    description: 1,
    birthday: 1,
    score: 1,
  })
  .exec()
  .then(parseData)
  .then(data => {
    if(!data) return Promise.reject({ errMsg: 'not found', status: 404 })
    const { avatar, attentions, fans, ...nextData } = data
    return {
      data: {
        ...nextData,
        attentions: attentions.length,
        fans: fans.length,
        avatar: avatarGet(avatar) 
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
.use('/attention', Attention.routes(), Attention.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/fans', Fans.routes(), Fans.allowedMethods())

module.exports = router
