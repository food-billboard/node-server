const Router = require('@koa/router')
const {
  dealErr,
  Params,
  responseDataDeal,
  ExchangeMemoryModel,
  UserModel,
  notFound
} = require('@src/utils')
const dayjs = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
  // 积分余额
  .get('/rest', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    })

    const data = await UserModel.findOne({
      _id
    })
      .select({
        score: 1
      })
      .exec()
      .then(notFound)
      .then(data => {
        const { score } = data
        return {
          data: score
        }
      })
      .catch(dealErr(ctx))

    responseDataDeal({
      ctx,
      data
    })

  })
  // 兑换奖品top
  .get('/exchange/top', async (ctx) => {

    const [_id] = Params.sanitizers(ctx.query, {
      name: '_id',
      sanitizers: [
        data => ObjectId(data)
      ]
    },)

    const {
      count = 10
    } = ctx.query

    const data = await ExchangeMemoryModel.aggregate([
      {
        $group: {
          _id: "$award",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: count
      }
    ])
      .then(data => {

        return {
          data: {
            list: data,
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