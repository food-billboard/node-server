const Router = require('@koa/router')
const { FeedbackModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
//反馈列表
.get('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    type: [ 'isMongoId' ]
  })

  if(check) return

  const [ currPage, pageSize, _id ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  }, {
    name: 'pageSize',
    _default: 30,
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

  const data = await FeedbackModel.aggregate([

  ])
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router