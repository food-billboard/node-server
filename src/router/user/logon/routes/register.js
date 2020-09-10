const Router = require('@koa/router')
const { encoded, signToken, Params, UserModel, RoomModel, responseDataDeal, dealErr } = require('@src/utils')

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
  const check = Params.body(ctx, {
    name: 'mobile',
    type: ['isMobilePhone']
  }, {
    name: 'password',
    validator: data => typeof data === 'string'
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


  //判断账号是否存在
  const account = new UserModel({
    ...createInitialUserInfo({ mobile, password })
  })
  
  const data = await account.save()
  .then(data => {
    if(!data) return Promise.reject({errMsg: '账号已存在', status: 403})
    const { avatar, _id, username, createdAt, updatedAt } = data
    const token = signToken({mobile, password})
    return {
      avatar,
      username,
      updatedAt,
      createdAt,
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
  .cache(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})

module.exports = router