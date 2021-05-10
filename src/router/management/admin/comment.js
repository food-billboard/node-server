const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound, Params, responseDataDeal, CommentModel } = require('@src/utils')
const { Aggregate, Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//评论列表
.get('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const [ currPage, pageSize, like, comment ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  }, {
    name: 'like',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
    ]
  }, {
    name: 'comment',
    sanitizers: [
      data => parseInt(data),
      data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
    ]
  })

  const aggregate = new Aggregate()
  aggregate.model(CommentModel)

  const data = await Promise.all([
    CommentModel.aggregate([
      {
        $match: {
          user_info: ObjectId(id),
          // createdAt: {
          //   $lte: end_date,
          //   ...(!!start_date ? { $gte: start_date } : {})
          // },
          // source_type: { $in: source_type }
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
      user_info: ObjectId(id),
      // createdAt: {
      //   $lte: end_date,
      //   ...(!!start_date ? { $gte: start_date } : {})
      // },
      // source_type: { $in: source_type }
    })
    .project({
      source_type: 1,
      source: 1,
      // user_info: 1,
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
    .project({
      source_type: 1,
      source: 1,
      sub_comments: 1,
      total_like: 1,
      content: {
        text: "$content.text",
        video: "$video.src",
        image: "$image.src"
      },
      createdAt: 1,
      updatedAt: 1
    })
  ])
  .then(([total_count, comment_data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(comment_data)) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: comment_data
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})

module.exports = router