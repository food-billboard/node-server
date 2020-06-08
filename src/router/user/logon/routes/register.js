const Router = require('@koa/router')
const { encoded, signToken, dealErr, UserModel, RoomModel } = require('@src/utils')

const router = new Router()

function createInitialUserInfo({mobile, password}) {
  return {
    mobile,
    password: encoded(password),
    username: '',
    fans: [],
    attention: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    rate: [],
    allow_many: false,
    status: 'SIGNIN',
  }
}

router
.post('/', async(ctx) => {
  const { body: { mobile, password, uid } } = ctx.request
  let res
  //判断账号是否存在
  const account = new UserModel({
    ...createInitialUserInfo({ mobile: mobile, password })
  })
  const data = await account.save()
  .then(data => {
    if(!data) return Promise.reject({errMsg: '账号已存在', status: 403})
    const { avatar, _id } = data
    const token = signToken({mobile, password})
    return {
      avatar,
      fans:0,
      attention:0,
      hot: 0,
      _id,
      token
    }
  })
  .then(async (data) => {
    const { _id } = data
    await Promise.all([
      ...(
        uid ? RoomModel.updateOne({
          origin: true,
          "members.sid": uid
        }, {
          $set: { "members.$.user": _id }
        })
        : 
        []
      ),
      RoomModel.updateOne({
        origin: false,
        type: 'SYSTEM',
        "members.user": { $nin: [ _id ] }
      }, {
        $push: { members: { message: [], user: _id, status: 'OFFLINE' } }
      })
    ])
    return data
  })
  .catch(err => {
    ctx.status = 403
    res = {
      success: false,
      res: null
    }
    console.log(err)
  })

  if(!res) {
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