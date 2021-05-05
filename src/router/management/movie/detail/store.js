const Router = require('@koa/router')
const { UserModel, dealErr, responseDataDeal, Params, USER_STATUS, ROLES_MAP } = require('@src/utils')
const Day = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//收藏
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ _id, currPage, pageSize, start_date, end_date, status, roles ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
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
    name: 'start_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
    ]
  }, {
    name: 'end_date',
    sanitizers: [
      data => ((typeof data === 'string' && (new Date(data)).toString() == 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
    ]
  },
  {
    name: 'status',
    sanitizers: [
      data => typeof data === 'string' ? [ data ] : USER_STATUS
    ]
  },
  {
    name: 'roles',
    sanitizers: [
      data => typeof data === 'string' ? [ data ] : Object.keys(ROLES_MAP)
    ]
  })

  const match = {
    "store._id": { $in: [ _id ] },
    "store.timestamps": {
      $lte: end_date.getTime(),
      ...(!!start_date ? { $gte: start_date.getTime() } : {})
    },
    roles: { $in: roles },
    status: { $in: status }
  }

  const data = await Promise.all([
    //统计总数
    UserModel.aggregate([
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
    //数据
    UserModel.aggregate([
      {
        $unwind: "$store"
      },
      {
        $match: {
          "store._id": _id
        }
      },
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
          from: 'movies', 
          localField: 'store._id', 
          foreignField: '_id', 
          as: 'movie',
        }
      },
      {
        $unwind: "$store"
      },
      {
        $unwind: '$movie'
      },
      {
        $lookup: {
          from: 'images', 
          localField: 'avatar', 
          foreignField: '_id', 
          as: 'avatar',
        }
      },  
      {
        $unwind: {
          path: "$avatar",
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          avatar: "$avatar.src",
          username: 1,
          mobile: 1,
          email: 1,
          hot: 1,
          status: 1,
          roles: 1,
          createdAt: 1,
          updatedAt: 1,
          store_date: "$store.timestamps",
          movie_name: "$movie.name",
          issue_count: {
            $size: {
              $ifNull: [
                "$issue", []
              ]
            }
          },
          fans_count: {
            $size: {
              $ifNull: [
                "$fans", []
              ]
            }
          },
          attentions_count: {
            $size: {
              $ifNull: [
                "$attentions", []
              ]
            }
          },
        }
      }
    ])
  ])
  .then(([total_count, user_data]) => {
    if(!Array.isArray(total_count) || !Array.isArray(user_data)) return Promise.reject({ errMsg: 'not found', status: 404 })

    return {
      data: {
        total: !!total_count.length ? total_count[0].total || 0 : 0,
        list: user_data
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