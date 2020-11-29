const Router = require('@koa/router')
const { dealErr, UserModel, notFound, Params, responseDataDeal, EMAIL_REGEXP, sendMail, dealRedis, EMAIL_AUTH, uuid } = require("@src/utils")
const { email_type } = require('../map')

const router = new Router()

const TEMPLATE_MAIL = {
  from: EMAIL_AUTH.email,
  subject: '身份认证',
  html: '<h1>你好，这是一封来自NodeMailer的邮件！</h1><p>用于身份认证，请在两分钟内进行认证！</p>',
}

router
.post('/', async (ctx) => {
  
  const check = Params.body(ctx, {
    name: 'email',
    validator: [data => EMAIL_REGEXP.test(data)]
  }, {
    name: 'type',
    validator: [ data => email_type.includes(data) ]
  })
  if(check) return

  const code = uuid().slice(0, 6)

  let send_mail_template = {
    ...TEMPLATE_MAIL,
    html: `${TEMPLATE_MAIL.html}<p>身份认证验证码为: ${code};</p>`
  }

  const { request: { body: { email, type } } } = ctx
  const redisKey = `${email}-${type}`

  const data = await type == 'forget' ? UserModel.findOne({
    email
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound) : Promise.resolve()
  .then(_ => {
    //判断之前是否存在验证码
    return dealRedis(function(redis) {
      return redis.get(redisKey)
    })
  })
  .then(data => {
    if(!!data) return Promise.reject({ status: 429, errMsg: 'request too frequently' })
    //存在该用户并存储验证码
    return dealRedis(function(redis) {
      return redis.set(redisKey, code, 'EX', 120)
    })
  })
  .then(_ => {
    //发送验证码
    return new Promise((resolve, reject) => {
      send_mail_template = {
        ...send_mail_template,
        to: email,
      }
      sendMail(send_mail_template, function(error, _) {
        if(error) {
          reject(error)
        }else {
          resolve()
        }
      })
      setTimeout(() => {
        reject('send email timeout')
      }, 10000)
    })
  })
  .then(_ => {
    return {
      data: 'send mail success'
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