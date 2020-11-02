const Router = require('@koa/router')
const Comment = require('./comment')
const Feedback = require('./feedback')
const Issue = require('./issue')
const Rate = require('./rate')
const { UserModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//用户详细信息
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

  const data = await UserModel.findOne({
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
.use('/feedback', Feedback.routes(), Feedback.allowedMethods())
.use('/issue', Issue.routes(), Issue.allowedMethods())
.use('/rate', Rate.routes(), Rate.allowedMethods())

module.exports = router