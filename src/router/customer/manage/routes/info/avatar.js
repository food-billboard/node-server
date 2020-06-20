const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, Params } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.put('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: '_id',
    type: [ 'isMongoId' ]
  })

  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  const [ _id ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const { mobile } = token
  let res
  const data = await UserModel.updateOne({
    mobile: Number(mobile)
  }, {
    $set: { avatar: _id }
  })
  .exec()
  .then(data => {
    if(data && data.nModified === 0) return Promise.reject({ errMsg: 'unknown error', status: 500 })
    return null
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