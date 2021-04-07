const Router = require('@koa/router')
const { MovieModel, dealErr, responseDataDeal, Params, MOVIE_STATUS } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.put('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })

  if(check) return 

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = MovieModel.updateOne({
    _id
  }, {
    $set: { status: MOVIE_STATUS.COMPLETE }
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

  const data = MovieModel.updateMany({
    _id: { $in: _ids }
  }, {
    $set: { status: MOVIE_STATUS.NOT_VERIFY }
  })
  .then(res => {
    if(res.nModified != _ids.length) {
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

module.exports = router