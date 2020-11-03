const Router = require('@koa/router')
const { UserModel, dealErr, responseDataDeal, Params, USER_STATUS, ROLES_MAP } = require('@src/utils')
const Day = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//电影访问用户列表(分页 时间 用户状态)
.get('/', async(ctx) => {

    const [ _id, currPage, pageSize, start_date, end_date, status, roles ] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    }, {
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
      name: 'start_date',
      sanitizers: [
        data => ((typeof data === 'string' && (new Date(data)).toString() !== 'Invalid Date') || typeof data === 'undefined') ? undefined : Day(data).toDate()
      ]
    }, {
      name: 'end_date',
      sanitizers: [
        data => ((typeof data === 'string' && (new Date(data)).toString() !== 'Invalid Date') || typeof data === 'undefined') ? Day().toDate() : Day(data).toDate()
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
      "glance._id": { $in: [ _id ] },
      "glance.timestamps": {
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
          $match: match
        },
        // {
        //   $sort: {}
        // },
        {
          $skip: currPage * pageSize
        },
        {
          $limit: pageSize
        },
        {
          $unwind: "$glance"
        },
        {
          $match: {
            "glance._id": _id
          }
        },
        {
          $lookup: {
            from: 'movies', 
            localField: 'glance._id', 
            foreignField: '_id', 
            as: 'movie'
          }
        },
        {
          $unwind: "$glance"
        },
        {
          $project: {
            username: 1,
            mobile: 1,
            email: 1,
            hot: 1,
            status: 1,
            roles: 1,
            creaetdAt: 1,
            updatedAt: 1,
            glance_date: "$glance.timestamps",
            movie_name: "$glance._id.name",
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
    // {
    //   data: {
    //     total,
    //     list: [{
    //       username,
    //       mobile,
    //       email,
    //       hot,
    //       status,
    //       roles,
    //       creaetdAt,
    //       updatedAt,
    //       glance_date,
    //       movie_name,
    //       issue_count,
    //       fans_count,
    //       attentions_count,
    //     }]
    //   }
    // }
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