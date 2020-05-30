const Router = require('@koa/router')
const { MongoDB, signToken, encoded, dealErr } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.post('/', async(ctx) => {
  const { body: { mobile, password, uid } } = ctx.request
  let res
  const data = await mongo.connect("user")
  .then(db => db.findOneAndUpdate({
    mobile: Number(mobile),
    password: encoded(password)
  }, {
    $set: {status: 'SIGNIN'}
  }, {
    projection: {
      allow_many: 1,
      create_time: 1,
      modified_time: 1,
      username:1,
      avatar: 1,
      hot:1,
      fans: 1,
      attention:1
    }
  }))
  .then(data => {
    if(data && !data.ok) return Promise.reject({errMsg: '账号或密码错误', status: 401})
    const { value: { fans=[], attentions=[], password:_, ...nextData } } = data
    const token = signToken({mobile, password})
    return {
      fans: fans.length,
      attentions: attentions.length,
      token,
      ...nextData
    }
  })
  .then(async (data) => {
    if(uid) {
      const { _id } = data
      await mongo.connect("room")
      .then(db => db.updateOne({
        origin: false,
        "member.sid": uid,
        "member.user": null
      }, {
        $set: { "member.$.user": _id }
      }))
    }
    return data
  })
  .then(async (data) => {
    const { _id } = data
    await mongo.connect("room")
    .then(db => db.updateOne({
      origin: false,
      type: 'system',
      "member.user": { $ne: _id }
    }, {
      $push: { member: { message: [], user: _id, status: 'offline', create_time: Date.now(), modified_time: Date.now() } }
    }))
    return data
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