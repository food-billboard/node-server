const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { GlobalModel, responseDataDeal, dealErr, notFound, Params, verifyTokenToData } = require('@src/utils')

const router = new Router()

router
.get('/', async (ctx) => {

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

  const data = await GlobalModel.aggregate([
    {
      $sort: {
        createdAt: 1
      }
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $project: {
        notice: 1,
        visit_count: 1,
        createdAt: 1,
        updatedAt: 1,
        info: 1,
        valid: 1
      }
    }
  ])
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: true,
    data: {
      data: {
        total: (total[0] || { total: 0 }).total,
        list: data
      }
    }
  })

})
.post('/', async (ctx) => {

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
  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const objId = ObjectId(id)

  const model = new GlobalModel({
    notice,
    info,
    visit_count: 0,
    valid: !!valid,
    origin: objId,
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
.delete('/', async (ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => {
        if(typeof data !== 'string' || !data.length) return false 
        const lists = data.split(',')
        return lists.every(item => ObjectId.isValid(item.trim()))
      }
    ]
  })

  if(check) return 

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => {
        return data.split(',').map(item => ObjectId(item.trim()))
      }
    ]
  })
  
  const data = await GlobalModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(data => {
    if(data.deletedCount === 0) return Promise.reject({ errMsg: 'not found', status: 404 })
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
.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
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