const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.put('/', async(ctx) => {
  const check = Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data.length > 0 && data.length <= 20,
    ]
  })

  if(check) return

  const [, token] = verifyTokenToData(ctx)
  const { id } = token
  const { body: { name } } = ctx.request

  const data = await UserModel.updateOne({
    _id: ObjectId(id)
  }, {
    $set: { username: name }
  })
  .exec()
  .then(data => {
    if(data && data.nModified === 0) return Promise.reject({ errMsg: 'unknown error', status: 500 })
    return {
      data: {
        name
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

module.exports = router