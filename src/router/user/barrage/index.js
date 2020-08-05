const Router = require('@koa/router')
const { BarrageModel, dealErr, notFound, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  //参数验证
  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId']
  })
  if(check) {
    ctx.body = JSON.stringify({ ...check.res })
    return
  }

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
    sort: {
      time_line: 1
    },
    ...(timeStart >= 0 ? { 
      $gt: { time_line: timeStart },
      ...(time >= 0 ? { $lt: { time_line: time + timeStart } } : {})
    } : {})
  })
  .select({
    user: 0,
    origin:0,
  })
  .limit(1000)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return data.map(item => {
      const { _doc: { like_users, ...nextItem } } = item
      return {
        ...nextItem,
        hot: like_users.length,
        like: !!~like_users.indexOf(mineId)
      }
    })
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router