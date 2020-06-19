const Router = require('@koa/router')
const { signToken, encoded, dealErr, UserModel, RoomModel, notFound, Params } = require("@src/utils")

const router = new Router()

router.post('/', async(ctx) => {
  const check = Params.body(ctx, {
    name: 'mobile',
    type: ['isMobilePhone']
  }, {
    name: 'password',
    validator: data => typeof data === 'string'
  })
  if(check) {
    ctx.body = JSON.stringify({
      ...check.res
    })
    return
  }

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
  let res
  const data = await UserModel.findOneAndUpdate({
    mobile,
    password: encoded(password)
  }, {
    $set: { status: 'SIGNIN' }
  })
  .select({
    allow_many: 1,
    create_time: 1,
    modified_time: 1,
    username:1,
    avatar: 1,
    hot:1,
    fans: 1,
    attention:1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { fans=[], attentions=[], password:_, avatar, ...nextData } = data
    const token = signToken({mobile, password})
    return {
      fans: fans.length,
      attentions: attentions.length,
      token,
      avatar: avatar ? avatar.src : null,
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