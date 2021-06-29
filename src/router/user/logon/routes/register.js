const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { 
  encoded, 
  signToken, 
  Params, 
  UserModel, 
  MemberModel, 
  FriendsModel,
  RoomModel, 
  responseDataDeal, 
  dealErr, 
  dealRedis, 
  EMAIL_REGEXP, 
  setCookie, 
  TOKEN_COOKIE, 
  ROLES_MAP 
} = require('@src/utils')
const { email_type } = require('../map')

const router = new Router()

function createInitialUserInfo({ mobile, password, username, avatar, description, ...nextData }) {

  let defaultModel = {
    mobile,
    password: encoded(password),
    fans: [],
    attention: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    rate: [],
    allow_many: false,
    status: 'SIGNIN',
    roles: ['CUSTOMER'],
    ...nextData
  }
  if(ObjectId.isValid(avatar)) defaultModel.avatar = avatar 
  if(!!username) {
    const [ realUsername, map] = username.split('\/9098')
    defaultModel.username = realUsername
    if(map) defaultModel.roles = [ Object.keys(ROLES_MAP).find(item => ROLES_MAP[item] == map) || "CUSTOMER" ]
  } 
  if(!!description) defaultModel.description = description
  return defaultModel
}

function createInitialMember(userId) {
  const model = new MemberModel({
    user: userId,
    room: []
  })
  return model.save()
}

function createInitialFriends(userId, memberId) {
  const model = new FriendsModel({
    user: userId,
    member: memberId,
  })
  return model.save()
}

router
.post('/', async(ctx) => {
  const check = Params.body(ctx, {
    name: 'mobile',
    validator: [data => /^1[3456789]\d{9}$/.test(data.toString())]
  }, {
    name: 'password',
    validator: [data => typeof data === 'string' && data.length >= 8 && data.length <= 20]
  }, {
    name: 'email',
    validator: [data => EMAIL_REGEXP.test(data)]
  },
  {
    name: 'captcha',
    validator: [data => typeof data === 'string' && data.length === 6]
  })
  if(check) return

  const [ password, uid, mobile ] = Params.sanitizers(ctx.request.body, {
    name: 'password',
    type: ['trim'],
  }, {
    name: 'uid',
    type: ['trim']
  }, {
    name: 'mobile',
    type: ['toInt']
  })
  const { request: { body: { email, captcha, username, description, avatar } } } = ctx

  //判断账号是否存在
  const data = await UserModel.findOne({
    $or: [
      {
        mobile: Number(mobile)
      },
      {
        email
      }
    ]
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data)
  .then(data => {
    if(data) return Promise.reject({errMsg: '账号已存在', status: 403})
    return dealRedis(function(redis) {
      return redis.get(`${email}-${email_type[1]}`)
    })
  })
  .then(data => {
    //判断验证码是否正确
    if(!data || (!!data && data != captcha)) return Promise.reject({ errMsg: 'the captcha is error', status: 400 })

    //创建用户
    const account = new UserModel({
      ...createInitialUserInfo({ mobile, password, email, username, description, avatar })
    })
    return account.save()
  })
  .then(data => {
    const { avatar, _id, username, createdAt, updatedAt } = data
    const token = signToken({ mobile, id: _id })

    //重置默认的koa状态码
    ctx.status = 200
    //设置cookie
    //临时设置，需要修改
    setCookie(ctx, { key: TOKEN_COOKIE, value: token, type: 'set' })
    
    return {
      avatar: avatar || null,
      username,
      updatedAt,
      createdAt,
      fans:0,
      attentions:0,
      hot: 0,
      _id,
      token
    }
  })
  .then(async (data) => {
    const { _id } = data
    await Promise.all([
      // ...(
      //   uid ? RoomModel.updateOne({
      //     origin: true,
      //     "members.sid": uid
      //   }, {
      //     $set: { "members.$.user": _id }
      //   })
      //   : 
      //   []
      // ),
      // RoomModel.updateOne({
      //   origin: false,
      //   type: 'SYSTEM',
      //   "members.user": { $nin: [ _id ] }
      // }, {
      //   $push: { members: { message: [], user: _id, status: 'OFFLINE' } }
      // }),
      createInitialMember(_id)
    ])
    .then(([member]) => {
      return createInitialFriends(_id, member._id)
    })
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