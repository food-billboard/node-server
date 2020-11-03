const Router = require('@koa/router')
const Comment = require('./comment')
const Feedback = require('./feedback')
const Issue = require('./issue')
const Rate = require('./rate')
const { UserModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.use(async (ctx, next) => {
  const check = Params.query(ctx, {
    name: '_id',
    type: [ 'isMongoId' ]
  })

  if(check) return
  return await next()
})
//用户详细信息
.get('/', async(ctx) => {

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await UserModel.aggregate([
    {
      $match: {
        _id
      }
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        mobile: 1,
        email: 1,
        username: 1,
        description: 1,
        avatar: 1,
        hot: 1,
        status: 1,
        roles: 1,
        fans_count: {
          $size: {
            $ifNull: [
              "$fans",
              []
            ]
          }
        },
        attentions_count: {
          $size: {
            $ifNull: [
              "$attentons",
              []
            ]
          }
        },
        issue_count: {
          $size: {
            $ifNull: [
              "$issue",
              []
            ]
          }
        },
        comment_count: {
          $size: {
            $ifNull: [
              "$comment",
              []
            ]
          }
        },
        store_count: {
          $size: {
            $ifNull: [
              "$store",
              []
            ]
          }
        },
      }
    }
  ])
  .then(data => !!data && data._doc)
  .then(notFound)
  // data: {
  //   createdAt,
  //   updatedAt,
  //   mobile,
  //   email,
  //   username,
  //   description,
  //   avatar,
  //   hot,
  //   status,
  //   roles,
  //   fans_count,
  //   attentions_count,
  //   issue_count,
  //   comment_count,
  //   store_count,
  // }
  .then(data => ({
    data
  }))
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