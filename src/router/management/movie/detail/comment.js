const Router = require('@koa/router')
const { MovieModel, CommentModel, dealErr, notFound, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId }, Aggregate } = require('mongoose')

const router = new Router()

router
//电影评论列表 时间 分页 排序（hot 时间 评论数量 点赞人数）
.get('/', async(ctx) => {

    const [ currPage, pageSize, _id, start_date, end_date, hot, time, comment ] = Params.sanitizers(ctx.query, {
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
      name: 'start_date',
      sanitizers: [
        data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
      ]
    }, {
      name: 'end_date',
      sanitizers: [
        data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
      ]
    }, {
      name: 'hot',
      sanitizers: [
        data => parseInt(data),
        data => Number.isNaN(data) ? -1 : data > 0 ? 1 : -1
      ]
    }, {
      name: 'time',
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
    aggregate.model(MovieModel)

    const data = await Promise.all([
      CommentModel.aggregate([
        {
          $match: {
            source: _id
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
      CommentModel.aggregate([
        {
          $match: {
            source_type: 'movie',
            source: _id,
            // createdAt: {
            //   $lte: end_date,
            //   ...(!!start_date ? { $gte: start_date } : {})
            // }
          }
        },
        {
          $project: {
            user_info: 1,
            total_like: 1,
            createdAt: 1,
            updatedAt: 1,
            like_person_count: {
              $size: {
                $ifNull: [
                  "$like_person",
                  []
                ]
              }
            },
            content: 1,
            comment_count: {
              $size: {
                $ifNull: [
                  "$sub_comments",
                  []
                ]
              }
            }
          }
        },
        {
          $sort: {
            total_like: hot,
            createdAt: time,
            comment_count: comment,
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
            localField: 'user_info', 
            foreignField: '_id', 
            as: 'user_info'
          }
        },
        {
          $unwind: "$user_info"
        },
        {
          $lookup: {
            from: 'images', 
            localField: 'content.image', 
            foreignField: '_id', 
            as: 'image'
          }
        },
        {
          $lookup: {
            from: 'videos', 
            localField: 'content.video', 
            foreignField: '_id', 
            as: 'video'
          }
        },
        {
          $project: {
            user_info: {
              _id: "$user_info._id",
              username: "$user_info.username"
            },
            comment_count: 1,
            total_like: 1,
            like_person_count: 1,
            content: {
              text: "$content.text",
              video: "$video.src",
              image: "$image.src",
            },
            createdAt: 1,
            updatedAt: 1
          }
        }
      ])
    ])
    // {
    //   data: {
    //     total,
    //     list: [{
    //       _id,
    //       user_info: {
    //         _id,
    //         uesrname
    //       },
    //       comment_count,
    //       total_like,
    //       like_person,
    //       content: {
    //         text,
    //         video,
    //         image,
    //       },
    //     }]
    //   }
    // }
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
      data,
      needCache: false
    })

})

module.exports = router