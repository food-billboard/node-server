const Router = require('@koa/router')
const { verifyTokenToData, dealErr, UserModel, RoomModel, notFound, responseDataDeal } = require("@src/utils")

const router = new Router()

router
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)

  const data = await new Promise((resolve, reject) => {
    if(token) {
      const { mobile } = token
      return resolve(mobile)
    }else {
      reject({ errMsg: 'not authorization', status: 401 })
    }
  })
  .then(mobile => {
    return UserModel.findOneAndUpdate({
      mobile: Number(mobile)
    }, {
      $set: { status: 'SIGNOUT' }
    })
    .select({
      _id: 1
    })
    .exec()
  })
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
    // console.log(data)
    // if(!data) return Promise.reject({errMsg: '服务器错误', status: 500})
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