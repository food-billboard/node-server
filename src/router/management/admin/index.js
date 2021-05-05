const Router = require('@koa/router')
const { merge } = require('lodash')
const Upload = require('./upload')
const Comment = require('./comment')
const { verifyTokenToData, UserModel, dealErr, notFound, responseDataDeal, Params, avatarGet, encoded } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//信息
.get('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await UserModel.findOne({
    _id: ObjectId(id)
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
    updatedAt: 1,
    mobile: 1,
    description: 1,
  })
  .populate({
    path: 'avatar',
    select: {
      src: 1,
    }
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { fans, attentions, issue, comment, store, avatar, ...nextData } = data
    return {
      data: {
        ...nextData,
        avatar: avatarGet(avatar),
        fans: fans.length,
        attentions: attentions.length,
        issue: issue.length,
        comment: comment.length,
        store: store.length,
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
   * mobile
   * email
   * password
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
  }, {
    name: 'mobile',
    validator: [
      data => !Number.isNaN(+data) && data.toString().length === 11
    ]
  }, {
    name: 'email',
    validator: [
      data => typeof data === 'string' && /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(data)
    ]
  })

  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { request: { body: { username, description, avatar, mobile, email, password } } } = ctx

  let updateField = {}
  if(username) updateField = merge({}, updateField, { username })
  if(avatar) updateField = merge({}, updateField, { avatar: ObjectId(avatar) })
  if(description) updateField = merge({}, updateField, { description })
  updateField = merge({}, updateField, { mobile: +mobile, email })
  if(typeof password === 'string' && password.length > 10) updateField = merge({}, updateField, { password: encoded(password) })

  const data = await UserModel.findOneAndUpdate({
    _id: ObjectId(id)
  }, {
    $set: updateField
  })
  .select({
    _id: 1,
  })
  .exec()
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