const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { UserModel, dealErr, responseDataDeal, notFound, Params } = require('@src/utils')

const router = new Router()

router
//评论列表
.get('/', async(ctx) => {

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? data : -1
    ]
  }, {
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
        _id: 0,
        comment: 1,
        total: {
          $size: {
            $ifNull: [
              "$comment",
              []
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'comments',
        localField: 'comment',
        foreignField: '_id',
        as: 'comment'
      }
    },
    {
      $unwind: "$comment"
    },
    {
      $sort: {
        "comment.createdAt": -1
      }
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'users',
        localField: 'comment.user_info',
        foreignField: '_id',
        as: 'user_info'
      }
    },
    {
      $project: {
        ...[ 'createdAt', 'updatedAt', 'source_type', 'total_like' ].reduce((acc, cur) => {
          acc[`comment.${cur}`] = 1
          return acc
        }, {}),
        "comment.comments": {
          $size: {
            $ifNull: [
              "$comment.sub_comments",
              []
            ]
          }
        },
        "comment.like_person": {
          $size: {
            $ifNull: [
              "comment.like_person",
              []
            ]
          }
        },
        "comment.user_info._id": 1,
        "comment.user_info.username": 1
      },
    },
  ])
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(([total_count, ]) => {
    
    return {
      data: {
        total,
        list
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router