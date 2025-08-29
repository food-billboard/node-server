const Router = require('@koa/router')
const {
  verifyTokenToData,
  dealErr,
  responseDataDeal,
  LongTimeTaskModel,
  APP_TYPE,
} = require('@src/utils')

const router = new Router()

router
  .get('/', async (ctx) => {

    const check = Params.query(ctx, {
      name: 'app',
      validator: [
        data => !!APP_TYPE[data]
      ]
    })
    if (check) return

    const [currPage, pageSize] = Params.sanitizers(ctx.query, {
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
    })

    const [, token] = verifyTokenToData(ctx)
    const { id } = token

    const {
      app,
      status
    } = ctx.query

    let match = {
      create_user: ObjectId(id),
      app,
    }
    if (status) {
      match.status = status
    }

    const data = await Promise.all([
      LongTimeTaskModel.aggregate([
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
        },
        {
          $project: {
            _id: 0,
            total: 1
          }
        }
      ]),
      LongTimeTaskModel.aggregate([
        {
          $match: match
        },
        {
          $sort: {
            updatedAt: -1
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
            let: {
              create_user_id: "$create_user"
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    "$eq": ["$_id", "$$create_user_id"]
                  },
                }
              },
              {
                $lookup: {
                  from: 'images',
                  as: 'avatar',
                  foreignField: "_id",
                  localField: "avatar"
                }
              },
              {
                $unwind: {
                  path: "$avatar",
                  preserveNullAndEmptyArrays: true
                }
              },
            ],
            as: 'create_user'
          }
        },
        {
          $unwind: {
            path: "$create_user",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            app: 1,
            page: 1,
            create_user: "$create_user._id",
            create_user_avatar: "$create_user.avatar.src",
            create_user_name: "$create_user.username",
            status: 1,
            request_url: 1,
            request_method: 1,
            request_data: 1,
            dealTime: 1,
            createdAt: 1,
            updatedAt: 1,
          }
        }
      ])
    ])
      .then(([total_data, data]) => {

        const [total = { total: 0 }] = total_data

        return {
          data: {
            list: data,
            total: total.total
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