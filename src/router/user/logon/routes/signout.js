const Router = require('@koa/router')
const { MongoDB, verifyTokenToData, dealErr } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  const { mobile } = token
  const data = await mongo.connect("user")
  .then(db => db.findOneAndUpdate({
    mobile: Number(mobile)
  }, {
    $set: { status: "SIGNOUT" }
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    if(!data.ok) return Promise.reject({ errMsg: '权限不足', status: 401 })
    return data.value._id
  })
  .then(id => {
    return mongo.connect("room")
    .then(db => db.findOneAndUpdate({
      origin: true,
      "member.user": id
    }, {
      $set: { "member.$.user": null }
    }, {
      projection: {
        _id: 1
      }
    }))
  })
  .then(data => {
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