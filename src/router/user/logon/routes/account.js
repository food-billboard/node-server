const Router = require('@koa/router')
const { signToken, encoded, dealErr, UserModel, RoomModel, Params, responseDataDeal, setCookie, TOKEN_COOKIE } = require("@src/utils")

const router = new Router()

router
.post('/', async(ctx) => {

  const check = Params.body(ctx, {
    name: 'mobile',
    validator: [data => /^1[3456789]\d{9}$/.test(data)]
  }, {
    name: 'password',
    validator: [data => typeof data === 'string' && data.length >= 8 && data.length <= 20]
  })
  if(check) return

  const [ password, uid, mobile ] = Params.sanitizers(ctx.request.body, {
    name: 'password',
    type: ['trim']
  }, {
    name: 'uid',
    type: ['trim']
  }, {
    name: 'mobile',
    type: ['toInt']
  })

  const { env } = ctx.request.body

  const data = await UserModel.findOneAndUpdate({
    mobile,
    password: encoded(password)
  }, {
    $set: { status: 'SIGNIN' }
  })
  .select({
    allow_many: 1,
    createdAt: 1,
    username:1,
    avatar: 1,
    hot:1,
    fans: 1,
    attention:1,
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(data => {
    if(!data) return Promise.reject({ errMsg: '账号或密码错误', status: 403 })
    return data
  })
  .then(data => {
    const { fans=[], attentions=[], password:_, avatar, roles, _id, ...nextData } = data
    const token = signToken({ mobile, id: _id })

    //重置默认的koa状态码
    ctx.status = 200
    //设置cookie
    //临时设置，需要修改
    setCookie(ctx, { key: TOKEN_COOKIE, value: token, type: 'set', options: { domain: env.toLowerCase() == 'prod' ? '47.111.229.250' : 'localhost' } })

    return {
      fans: fans.length,
      attentions: attentions.length,
      token,
      avatar: avatar ? avatar.src : null,
      _id,
      ...nextData
    }
  })
  .then(async (data) => {
    const { _id } = data
    await Promise.all([
      ...(uid ? [RoomModel.updateOne({
        origin: false,
        "members.sid": uid,
        "members.user": null
      }, {
        $set: { "members.$.user": _id }
      })] : []),
      RoomModel.updateOne({
        origin: true,
        type: 'SYSTEM',
        "members.user": { $ne: _id }
      }, {
        $push: { members: { message: [], user: _id, status: 'OFFLINE' } }
      })
    ])
    return {
      data
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