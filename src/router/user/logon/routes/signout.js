const Router = require('@koa/router')
const { verifyTokenToData, dealErr, UserModel, RoomModel, notFound } = require("@src/utils")

const router = new Router()

router
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  if(!token) {
    ctx.status = 401
    ctx.body = {
      success: false,
      res: {
        errMsg: '未登录或信息错误'
      }
    }
    return
  }
  let res
  const { mobile } = token

  const data = await UserModel.findOneAndUpdate({
    mobile: Number(mobile)
  }, {
    $set: { status: 'SIGNOUT' }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(notFound)
  .then(userId => {
    return RoomModel.findOneAndUpdate({
      origin: true,
      "members.user": userId
    }, {
      $set: { "members.$.sid": null }
    })
    .select({
      _id: 1
    })
    .exec()
  })
  .then(data => !!data && data._id)
  .then(data => {
    console.log(data)
    if(!data) return Promise.reject({errMsg: '服务器错误', status: 500})
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = data.res
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