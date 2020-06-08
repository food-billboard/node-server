const Router = require('@koa/router')
const { signToken, encoded, dealErr, UserModel, RoomModel, notFound } = require("@src/utils")

const router = new Router()

router.post('/', async(ctx) => {
  const { body: { mobile, password, uid } } = ctx.request
  let res
  const data = await UserModel.findOneAndUpdate({
    mobile: Number(mobile),
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
    const { fans=[], attentions=[], password:_, ...nextData } = data
    const token = signToken({mobile, password})
    return {
      fans: fans.length,
      attentions: attentions.length,
      token,
      ...nextData
    }
  })
  .then(async (data) => {
    const { _id } = data
    await Promise.all([
      ...(uid ? [RoomModel.updateOne({
        origin: false,
        "member.sid": uid,
        "member.user": null
      }, {
        $set: { "member.$.user": _id }
      })] : []),
      RoomModel.updateOne({
        origin: false,
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