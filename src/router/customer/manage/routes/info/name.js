const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, Params } = require('@src/utils')

const router = new Router()

router
.put('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: 'name',
    validator: [
      data => typeof data === 'string' && data > 0,
    ]
  })

  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

  const { mobile } = token
  const { body: { name } } = ctx.request
  let res
  // const data = await UserModel.findOne({
  //   username: name
  // })
  // .select({
  //   _id: 1
  // })
  // .exec()
  // .then(data => !!data && data._id)
  // .then(data => {
  //   if(data) return Promise.reject({ errMsg: '重名', status: 403 })
  //   return UserModel.updateOne({
  //     mobile: Number(mobile)
  //   }, {
  //     username: name
  //   })
  // })
  const data = await UserModel.updateOne({
    mobile: Number(mobile)
  }, {
    username: name
  })
  .exec()
  .then(data => {
    if(data && data.nModified === 0) return Promise.reject({ errMsg: 'unknown error', status: 500 })
    return name
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