const Router = require('@koa/router')
const { Types: { ObjectId }, Aggregate } = require('mongoose')
const { CommentModel, dealErr, verifyTokenToData, responseDataDeal, Params, COMMENT_SOURCE_TYPE, notFound, findMostRole, ROLES_MAP } = require('@src/utils')
const { UserModel } = require('../../../../utils/mongodb/mongo.lib')

const router = new Router()

router
//评论列表
.get('/', async(ctx) => {

  const [ currPage, pageSize, _id, source_type, start_date, end_date, like, comment ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => parseInt(data),
      data => data >= 0 ? data : 30
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'source_type',
    sanitizers: [
      data => typeof data === 'string' ? [ data ] : Object.keys(COMMENT_SOURCE_TYPE)
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() !== 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() !== 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'like',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? data > 0 ? 1 : -1 : -1
    ]
  }, {
    name: 'comment',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? data > 0 ? 1 : -1 : -1
    ]
  })

  const aggregate = new Aggregate()
  aggregate.model(CommentModel)

  const data = await Promise.all([
    CommentModel.aggregate([
      {
        $match: {
          user_info: _id,
          createdAt: {
            $lte: end_date,
            ...(!!start_date ? { $gte: start_date } : {})
          },
          source_type: { $in: source_type }
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    aggregate
    .match({
      user_info: _id,
      createdAt: {
        $lte: end_date,
        ...(!!start_date ? { $gte: start_date } : {})
      },
      source_type: { $in: source_type }
    })
    .project({
      source_type: 1,
      source: 1,
      user_info: 1,
      sub_comments: {
        $size: {
          $ifNull: [
            "$sub_comments", []
          ]
        }
      },
      total_like: 1,
      content: 1,
      createdAt: 1,
      updatedAt: 1
    })
    .sort({
      total_like: like, 
      sub_comments: comment
    })
    .skip(currPage * pageSize)
    .limit(pageSize)
    .lookup({
      from: 'users',
      localField: 'user_info',
      foreignField: '_id',
      as: 'user_info'
    })
    .unwind("user_info")
    .lookup({
      from: 'images',
      localField: 'content.image',
      foreignField: '_id',
      as: 'image'
    })
    .lookup({
      from: 'videos',
      localField: 'content.video',
      foreignField: '_id',
      as: 'video'
    })
    .unwind("content.video")
    .project({
      source_type: 1,
      source: 1,
      user_info: {
        _id: "$user_info._id",
        username: "$user_info.username"
      },
      sub_comments: 1,
      total_like: 1,
      content: {
        text: "$content.text",
        video: "$content.video.src",
        image: "$content.image.src"
      },
      createdAt: 1,
      updatedAt: 1
    })
  ])
  .then(([total_count, comment_data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(comment_data)) return Promise.reject({ errMsg: 'not found', status: 404 })

    return {

      // {
      //   data: {
      //     total,
      //     list: [{
      //       _id,
      //       source_type,
      //       source,
      //       user_info: {
      //         _id,
      //         username
      //       },
      //       sub_comments,
      //       total_like,
      //       content: {
      //         text,
      //         video,
      //         image
      //       },
      //       createdAt,
      //       updatedAt
      //     }]
      //   }
      // }

      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: comment_data
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
//权限判断
.use(async (ctx, next) => {

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [ , token ] = verifyTokenToData(ctx)

  const { mobile } = token

  let userMaxRole = 100
  let selfMaxRole = 100

  const data = CommentModel.findOne({
    _id
  })
  .select({
    author: 1,
    _id: 0
  })
  .populate({
    path: 'author',
    select: {
      roles: 1
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { author: { roles } } = data
    userMaxRole = findMostRole(roles)
    if(userMaxRole == ROLES_MAP.SUPER_ADMIN) return Promise.reject({ errMsg: 'forbidden', status: 403 })
    return UserModel.findOne({ mobile: Number(mobile) })
    .select({
      _id: 0,
      roles: 1
    })
    .exec()
  })
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { roles } = data
    selfMaxRole = findMostRole(roles)
    if(selfMaxRole >= userMaxRole) return Promise.reject({ errMsg: 'forbidden', status: 403 }) 
    return
  })
  .catch(dealErr(ctx))

  if(!data) return await next()

  responseDataDeal({
    ctx, 
    data,
    needCache: false
  })

})
//删除评论
.delete('/', async(ctx) => {
  
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await CommentModel.deleteOne({
    _id
  })
  .then(data => {
    if(data.nModified == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: null
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