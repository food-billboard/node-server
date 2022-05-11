const Router = require('@koa/router')
const { BarrageModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { merge } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  //参数验证
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return

  const [ timeStart, process, _id ] = Params.sanitizers(ctx.query, {
    name: 'timeStart',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'process',
    _default: 1000 * 60 * 2,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let query = {
    origin: _id,
  }
  if(timeStart >= 0) {
    query.time_line = {
      $gt: timeStart
    }
    if(process >= 0) query.time_line.$lte = process + timeStart
  }

  const data = await BarrageModel.aggregate([
    {
      $match: query
    },
    {
      $sort: {
        createdAt: -1,
        time_line: 1
      }
    },
    {
      $limit: 1000
    },
    {
      $project: {
        hot: {
          $size: {
            $ifNull: [
              "$like_users", []
            ]
          }
        },
        content: 1,
        time_line: 1,
        updatedAt: 1,
        // like: false
      }
    }
  ])
  .then(data => ({ data: data.map(item => merge({}, item, { like: false })) }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router