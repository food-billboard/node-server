const Router = require('@koa/router')
const Comment = require('./comment')
const User = require('./user')
const { MovieModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//id判断中间件
.use(async (ctx, next) => {
  return await next()
})
//电影详细信息
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
      name: '_id',
      type: [ 'isMongoId' ]
  })

  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
  })

  const data = await MovieModel.findOne({
      _id
  })
  .select({

  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {

  })
  .catch(dealErr(ctx))

  responseDataDeal({
      ctx,
      data,
      needCache: false
  })

})
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/user', User.routes(), User.allowedMethods())

module.exports = router