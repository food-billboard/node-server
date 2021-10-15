const Router = require('@koa/router')
const { 
  signToken, 
  Params, 
  UserModel, 
  responseDataDeal, 
  dealErr, 
  dealRedis, 
  EMAIL_REGEXP, 
  setCookie, 
  TOKEN_COOKIE, 
  initialUserData,
  cookieDomainSet
} = require('@src/utils')
const { email_type } = require('../map')

const router = new Router()

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
  const { request: { body: { email, captcha, username, description, avatar, env } } } = ctx

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
    return initialUserData({
      mobile, password, email, username, description, avatar
    })
  })
  .then(data => {
    const { avatar, _id, username, createdAt, updatedAt } = data
    const token = signToken({ mobile, id: _id })

    //重置默认的koa状态码
    ctx.status = 200
    //设置cookie
    //临时设置，需要修改
    setCookie(ctx, { key: TOKEN_COOKIE, value: token, type: 'set', options: { domain: cookieDomainSet(env) } })
    
    return {
      data: {
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