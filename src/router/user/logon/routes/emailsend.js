const Router = require('@koa/router')
const { dealErr, UserModel, notFound, Params, responseDataDeal, EMAIL_REGEXP, sendEmail, redis, email_type } = require("@src/utils")

const router = new Router()

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

  const send_mail_template = {
    code: ''
  }

  const { request: { body: { email, type } } } = ctx
  const redisKey = `${email}-${type}`

  const data = await UserModel.findOne({
    emial
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(_ => {
    //判断之前是否存在验证码
    return redis.get(redisKey)
  })
  .then(data => {
    if(!!data) return Promise.reject({ status: 429, errMsg: 'request too frequently' })
    //存在该用户并存储验证码
    return redis.set(redisKey, send_mail_template.code, 120)
  })
  .then(_ => {
    //发送验证码
    return new Promise((resolve, reject) => {
      sendEmail(send_mail_template, function(error, _) {
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