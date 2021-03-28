const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { GlobalModel, responseDataDeal, dealErr, notFound, Params } = require('@src/utils')

const router = new Router()

router
.get('/info', async (ctx) => {

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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

  const total = await GlobalModel.aggregate([
    {
      $project: {
        _id: 1
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1
        }
      }
    }
  ])

  const data = await GlobalModel.find({})
  .select({
    notice: 1,
    visit_count: 1,
    createdAt: 1,
    updatedAt: 1,
    info: 1,
    valid: 1
  })
  .sort({
    createdAt: 1
  })
  .skip(currPage * pageSize)
  .limit(pageSize)
  .exec()
  .then(data => ({
    data
  }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data: {
      data: {
        total,
        list: data
      }
    }
  })

})
.post('/info', async (ctx) => {

  const check = Params.body(ctx, {
    name: 'info',
    type: ['isEmpty'],
    validator: [
      data => typeof data === 'string' && data.length > 0
    ]
  },
  {
    name: 'notice',
    type: ['isEmpty'],
    validator: [
      data => typeof data === 'string' && data.length > 0
    ]
  })

  if(check) return 

  const { notice, info, valid } = ctx.request.body

  const model = new GlobalModel({
    notice,
    info,
    visit_count: 0,
    valid: !!valid
  })

  const data = await model.save()
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/info', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    type: ['isMongoId'],
  })

  if(check) return 

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await GlobalModel.findOne({
    _id
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(_ => GlobalModel.deleteOne({
    _id
  }))
  .then(data => {
    if(data.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data: {
        data: null
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
.put('/info', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    type: ['isMongoId']
  })

  if(check) return 

  const { notice, info, valid } = ctx.request.body

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  let setFields = {}
  if(!!notice) setFields.notice = notice 
  if(!!info) setFields.info = info 
  if(typeof valid === 'boolean') setFields.valid = valid

  const data = await GlobalModel.findOneAndUpdate({
    _id
  }, {
    $set: setFields
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => ({ data: { _id: data._id } }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})


module.exports = router