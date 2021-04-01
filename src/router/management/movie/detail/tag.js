const Router = require('@koa/router')
const { TagModel, dealErr, responseDataDeal, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.put('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: 'valid',
    validator: [
      data => typeof data === 'boolean'
    ]
  }, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ _id, valid ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'valid',
    sanitizers: [
      data => !!data
    ]
  })

  const data = TagModel.updateOne({
    _id
  }, {
    $set: { valid }
  })
  .then(res => {
    if(res.nModified != 1) {
      return Promise.reject({ errMsg: 'not found', status: 400 })
    }
    return true
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
.delete('/', async(ctx) => {

  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item.trim()))
    ]
  })

  if(check) return 

  const [ _ids ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = TagModel.deleteMany({
    _id: { $in: _ids }
  })
  .then(res => {
    if(res.deletedCount == 0) return Promise.reject({ errMsg: 'not found', status: 400 })
    return true
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router