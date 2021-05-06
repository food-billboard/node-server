const Router = require('@koa/router')
const { UserModel, dealErr, Params, responseDataDeal, ROLES_MAP, USER_STATUS } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')
const Day = require('dayjs')

const router = new Router()

router
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return

  const [ currPage, pageSize, role, start_date, end_date, status, _id ] = Params.sanitizers(ctx.query, {
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
    name: 'role',
    sanitizers: [
      data => {
        return (typeof data === 'string') ? [ data ] : Object.keys(ROLES_MAP)
      }
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
    name: 'status',
    sanitizers: [
      data => (typeof data === 'string') ? [ data ] : USER_STATUS
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })
  const { query: { content='' } } = ctx

  const contentReg = {
    $regex: content,
    $options: 'ig'
  }

  const match = {
    "fans._id": { $in: [_id] }
  }

  const data = await Promise.all([
    //用户总数
    UserModel.aggregate([
      {
        $match: match
      },
      {
        $project: {
          _id: null,
          total: {
            $sum: 1
          }
        }
      }
    ]),
    UserModel.aggregate([
      {
        $match: {
          ...match,
          createdAt: {
            $lte: end_date,
            ...(!!start_date ? { $gte: start_date } : {})
          },
          roles: {
            $in: role
          },
          status: {
            $in: status
          },
          $or: [ 'username', 'email', 'mobile' ].map(item => ({ [item]: contentReg }))
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
          from: 'images', 
          localField: 'avatar', 
          foreignField: '_id', 
          as: 'avatar'
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
          createdAt: 1,
          updatedAt: 1,
          username: 1,
          mobile: 1,
          email: 1,
          hot: 1,
          status: 1,
          roles: 1,
          avatar: "$avatar.src",
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