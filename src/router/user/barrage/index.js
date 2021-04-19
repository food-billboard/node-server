const Router = require('@koa/router')
const { BarrageModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
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

  const data = await BarrageModel.find({
    origin: _id,
    ...(timeStart >= 0 ? { 
      $gt: { time_line: timeStart },
      ...(process >= 0 ? { $lt: { time_line: process + timeStart } } : {})
    } : {})
  })
  .select({
    like_users: 1,
    content: 1,
    time_line: 1,
    updatedAt: 1,
  })
  .limit(1000)
  .sort({
    time_line: 1
  })
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return {
      data: data.map(item => {
        const { _doc: { like_users, ...nextItem } } = item
        return {
          ...nextItem,
          hot: like_users.length,
          like: false
        }
      })
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