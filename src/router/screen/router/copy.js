const Router = require('@koa/router')
const { pick } = require('lodash')
const { verifyTokenToData, dealErr, Params, responseDataDeal, ScreenModal, notFound, loginAuthorization, getCookie, SCREEN_TYPE } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

// 大屏复制
router
.post('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: '_id',
    validator: [
      data => data.split(',').every(item => ObjectId.isValid(item.trim()))
    ]
  })

  if(check) {
    return 
  }

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await ScreenModal.aggregate([
    {
      $match: {
        _id: {
          $in: _id
        },
        user: ObjectId(id)
      }
    }
  ])
  .then(data => {
    return Promise.all(data.map(item => {
      const data = pick(item, ['data', 'flag', 'name', 'poster', 'description', 'version'])
      const model = new ScreenModal({
        ...data,
        user: ObjectId(item.user) 
      })
      return model.save()
      .then(data => data._id)
    }))
  })
  .then(data => {
    if(!data.length) return Promise.reject({ errMsg: 'not found', status: 404 })
    return {
      data  
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router