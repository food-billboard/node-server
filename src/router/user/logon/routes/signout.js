const Router = require('@koa/router')
const { Types: { ObjectId }} = require('mongoose')
const { verifyTokenToData, dealErr, UserModel, RoomModel, notFound, responseDataDeal, setCookie, TOKEN_COOKIE } = require("@src/utils")

const router = new Router()

router
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)

  const data = await new Promise((resolve, reject) => {
    if(token) {
      const { id } = token
      return resolve(id)
    }else {
      reject({ errMsg: 'not authorization', status: 401 })
    }
  })
  .then(id => {
    return UserModel.findOneAndUpdate({
      _id: ObjectId(id)
    }, {
      $set: { status: 'SIGNOUT' }
    })
    .select({
      _id: 1
    })
    .exec()
  })
  .then(notFound)
  .then(data => data._id)
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
  .then(_ => {
    // if(!data) return Promise.reject({errMsg: '服务器错误', status: 500})

    //重置默认的koa状态码
    ctx.status = 200
    //设置cookie
    //临时设置，需要修改
    setCookie(ctx, { key: TOKEN_COOKIE, value: token, type: 'delete' })

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