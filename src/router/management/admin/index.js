const Router = require('@koa/router')
const Upload = require('./upload')
const Comment = require('./comment')
const { verifyTokenToData, UserModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

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
    updatedAt: 1,
    issue: 1,
    comment: 1,
    store: 1,
    email: 1,
    roles: 1,
    createdAt: 1,
    updatedAt: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { fans, attentions, issue, comment, store, ...nextData } = data
    return {
      data: {
        ...nextData,
        fans: fans.length,
        attentions: attentions.length,
        issue: issue.length,
        comment: comment.length,
        store: store.length,
        mobile,

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
  /**
   * username
   * avatar
   * description
   */

  const check = Params.body(ctx, {
    name: 'username',
    validator: [
      data => typeof data === 'string' ? data.length > 0 && data.length <= 20 : typeof data === 'undefined',
    ]
  }, {
    name: 'avatar',
    validator: [
      data => typeof data === 'string' ? ObjectId.isValid(data) : typeof data === 'undefined'
    ]
  }, {
    name: "description",
    validator: [
      data => typeof data === 'string' ? data.length > 0 && data.length <= 50 : typeof data === 'undefined',
    ]
  })

  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { request: { body: { username, description, avatar } } } = ctx

  let updateField = {}
  if(username) updateField = { ...updateField, username }
  if(avatar) updateField = { ...updateField, avatar: ObjectId(avatar) }
  if(description) updateField = { ...updateField, description }

  console.log(updateField)

  const data = await UserModel.findOneAndUpdate({
    mobile: Number(mobile)
  }, {
    $set: updateField
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => ({
    data: {
      _id: data._id
    }
  }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})
.use('/upload', Upload.routes(), Upload.allowedMethods())
.use('/comment', Comment.routes(), Comment.allowedMethods())

module.exports = router

/**
 * {
  username,
  avatar,
  hot,
  fans: number,
  attentions: number,
  createdAt,
  updatedAt
  _id,
}
 */
/**
 * _id
 */