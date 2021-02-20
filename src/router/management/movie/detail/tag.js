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
      throw new Error({ errMsg: 'not found', status: 400 })
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
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = TagModel.deleteOne({
    _id
  })
  .then(res => {
    if(res.deletedCount != 1) return Promise.reject({ errMsg: 'not found', status: 400 })
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