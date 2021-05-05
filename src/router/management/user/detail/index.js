const Router = require('@koa/router')
const Comment = require('./comment')
const Feedback = require('./feedback')
const Issue = require('./issue')
const Rate = require('./rate')
const Fans = require('./fans')
const Attentions = require('./attentions')
const { UserModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
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
      $lookup: {
        from: 'images', 
        localField: 'avatar', 
        foreignField: '_id', 
        as: 'avatar'
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
        avatar: "$avatar.src",
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
              "$attentions",
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
  .then(data => !!data && data.length == 1 && data[0])
  .then(notFound)
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
.use('/fans', Fans.routes(), Fans.allowedMethods())
.use('/attentions', Attentions.routes(), Attentions.allowedMethods())

module.exports = router