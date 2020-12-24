const Router = require('@koa/router')
const { verifyTokenToData, UserModel, ImageModel, dealErr, Params, responseDataDeal, notFound } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.put('/', async(ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    type: [ 'isMongoId' ]
  })

  if(check) return

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await ImageModel.findOne({
    _id
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data)
  .then(notFound)
  .then(_ => {
    return UserModel.updateOne({
      _id: ObjectId(id)
    }, {
      $set: { avatar: _id }
    })
    .exec()
  })
  .then(data => {
    if(data && data.nModified === 0) return Promise.reject({ errMsg: 'unknown error', status: 500 })
    return {
      data: {}
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