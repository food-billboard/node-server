const Router = require('@koa/router')
const {
  dealErr,
  Params,
  responseDataDeal,
  ExchangeMemoryModel,
  ScoreMemoryModel,
} = require('@src/utils')
const dayjs = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 近12月每月积分获取数/支出数
  .get('/score/get-post', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    },)

    const {
      monthCount = 12
    } = ctx.query

    const data = await Promise.all([
      ScoreMemoryModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: dayjs().subtract(monthCount, 'month').startOf('month')
            },
            target_user: _id
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            total: { $sum: "$target_score" }
          }
        }
      ]),
      ExchangeMemoryModel.aggregate([
        {
          $match: {
            createdAt: {
              $gte: dayjs().subtract(monthCount, 'month').startOf('month')
            },
            exchange_target: _id
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            total: { $sum: "$exchange_score" }
          }
        }
      ]),
    ])
      .then(([get, post]) => {

        return {
          data: {
            get: get.map(item => {
              return {
                label: `${item.year}-${item.month}`,
                value: item.total
              }
            }),
            post: post.map(item => {
              return {
                label: `${item.year}-${item.month}`,
                value: item.total
              }
            }),
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