const Router = require('@koa/router')
const { dealErr, UserModel, encoded, Params, responseDataDeal, redis, notFound } = require("@src/utils")
const { email_type } = require('../map')

const router = new Router()

router
.put('/', async (ctx) => {

  const check = Params.body(ctx, {
    name: 'email',
    validator: [data => EMAIL_REGEXP.test(data)]
  },
  {
    name: 'captcha',
    validator: [data => typeof data === 'string' && data.length === 6]
  }, {
    name: 'password',
    validator: [ data => typeof data === 'string' && data.length >= 8 && data.length <= 20 ]
  })
  if(check) return

  const { request: { body: { email, captcha, password } } } = ctx
  const redisKey = `${email}-${email_type[0]}`

  const data = await redis.get(redisKey)
  .then(data => {
    if(data != captcha) return Promise.reject({ errMsg: 'captcha is error', status: 400 }) 
    return UserModel.findOneAndUpdate({
      email
    }, {
      password: encoded(password)
    })
    .select({
      _id: 1
    })
    .exec()
  })
  .then(data => !!data && data._doc._id)
  .then(notFound)
  .then(_ => {
    return {
      data: {
        data: 'the password is reset'
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