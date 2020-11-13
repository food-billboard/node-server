const Router = require('@koa/router')
const { MovieModel, dealErr, Params, responseDataDeal, MOVIE_STATUS } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

const router = new Router()

router
//上传电影列表
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ currPage, pageSize, _id, end_date, start_date, status ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? data : 30
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  }, {
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day().toDate()
    ]
  }, {
    name: 'status',
    sanitizers: [
      data => typeof data === 'undefined' ? Object.keys(MOVIE_STATUS) : [ data ] 
    ]
  })

  const match = {
    author: _id,
    createdAt: {
      $lte: end_date,
      ...(!!start_date ? { $gte: start_date } : {})
    },
    status: { $in: status }
  }

  const data = await Promise.all([
    MovieModel.aggregate([
      {
        $match: match
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
    MovieModel.aggregate([
      {
        $match: match
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
          localField: 'author', 
          foreignField: '_id', 
          as: 'author'
        }
      },
      {
        $unwind: "$author"
      },
      {
        $project: {
          name: 1,
          glance: 1,
          hot: 1,
          rate_person: 1,
          total_rate: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          barrage_count: {
            $size: {
              $ifNull: [
                "$barrage", []
              ]
            }
          },
          tag_count: {
            $size: {
              $ifNull: [
                "$tag", []
              ]
            }
          },
          comment_count: {
            $size: {
              $ifNull: [
                "$comment", []
              ]
            }
          },
          author: {
            _id: "$author._id",
            username: "$author.username"
          },
        }
      }
    ])
  ])
  .then(([ total_count, issue_data ]) => {

    if(!Array.isArray(total_count) || !Array.isArray(issue_data)) return Promise.reject({ errMsg: 'data error', status: 404 })

    return {
      // {
      //   data: {
      //     total,
      //     list: [{
      //       _id,
      //       name,
      //       glance,
      //       hot,
      //       rate_person,
      //       total_rate,
      //       status,
      //       barrage_count,
      //       tag_count,
      //       comment_count,
      //       createdAt,
      //       updatedAt,
      //       author: {
      //         _id,
      //         username
      //       },
      //     }]
      //   }
      // }
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: issue_data
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