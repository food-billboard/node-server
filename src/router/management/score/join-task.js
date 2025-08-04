const Router = require('@koa/router')
const {
  dealErr,
  Params,
  responseDataDeal,
  UserModel,
} = require('@src/utils')
const dayjs = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 获取
  .get('/', async (ctx) => {

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

    const {
      content = '',
    } = ctx.query

    let match = {
      join_task: true
    }
    if (content) {
      match.$or = [
        {
          mobile: {
            $regex: content,
            $options: 'gi'
          }
        },
        {
          username: {
            $regex: content,
            $options: 'gi'
          }
        },
      ]
    }

    const data = await Promise.all([
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
        },
        {
          $project: {
            _id: 0,
            total: 1
          }
        }
      ]),
      UserModel.aggregate([
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
        {
          $project: {
            _id: 1,
            username: 1,
            email: 1,
            description: 1,
            avatar: "$avatar.src",
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
  // 修改
  .put('/', async (ctx) => {
    const check = Params.body(ctx, {
      name: '_id',
      validator: [
        data => ObjectId.isValid(data)
      ]
    })

    if (check) return

    const [_id] = Params.sanitizers(ctx.request.body, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const {
      join_task
    } = ctx.request.body

    const data = await UserModel.updateOne({
      _id,
    }, {
      $set: {
        join_task: !!join_task
      }
    })
      .then(data => {
        if (data.nModified === 0) return Promise.reject({ status: 404, errMsg: 'not Found' })
        return {
          data: data._id || _id
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })
  })

module.exports = router