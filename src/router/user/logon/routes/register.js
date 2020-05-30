const Router = require('@koa/router')
const { MongoDB, encoded, signToken, dealErr } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

function createInitialUserInfo({mobile, password}) {
  return {
    mobile,
    password: encoded(password),
    avatar: '默认头像',
    hot: 0,
    username: '',
    fans: [],
    attention: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    rate: [],
    allow_many: false,
    create_time: Date.now(),
    modified_time: Date.now(),
    status: 'SIGNIN',
  }
}

router
.post('/', async(ctx) => {
  const { body: { mobile, password, uid } } = ctx.request
  let res
  //判断账号是否存在
  const data = await mongo.connect("user")
  .then(db => db.findOne({mobile}, {projection: {mobile: 1}}))
  .then(data => data && data.mobile)
  .then(mobile => {
    if(mobile) return Promise.reject({errMsg: '账号已存在', status: 403})
  })
  .then(_ => mongo.connect("user"))
  .then(db => db.insertOne(createInitialUserInfo({ mobile, password })))
  .then(data => {
    const { ops } = data
    const { _id } = ops[0]
    const token = signToken({mobile, password})
    return {
      avatar: '默认头像',
      fans:0,
      attention:0,
      hot: 0,
      _id,
      token
    }
  })
  .then(async (data) => {
    if(uid) {
      const { _id } = data
      await mongo.connect("room")
      .then(db => db.updateOne({
        origin: true,
        "member.sid": uid
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
      "member.user": { $nin: [ _id ] }
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