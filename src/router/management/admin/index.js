const Router = require('@koa/router')
const Upload = require('./upload')
const Comment = require('./comment')
const { verifyTokenToData, UserModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

const EDIT_FIELDS = []

router
//信息
.get('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
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
  .then(notFound)
  .then(data => {
    const { fans, attentions, ...nextData } = data
    return {
      data: {
        ...nextData,
        fans: fans.length,
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
//修改
.put('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: '',
    type: [  ],
    validator: []
  })
  
})
.use('/upload', Upload.routes(), Upload.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())

module.exports = router