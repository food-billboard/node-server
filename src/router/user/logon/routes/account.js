const Router = require('@koa/router')
const { MongoDB, withTry, signToken, encoded } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.post('/', async(ctx) => {
  const { body: {mobile, password} } = ctx.request
  let res
  const [err, data] = await withTry(mongo.findOne)("_user_", {
    mobile,
    password: encoded(password)
  },{
    allow_many: 1,
    create_time: 1,
    modified_time: 1,
    username:1,
    avatar: 1,
    hot:1,
    fans: 1,
    attention:1
  })
  if(err) {
    ctx.status = 500
    res = {
      success: false,
      res: null
    }
  }else {
    if(data) {
      const { fans, attentions, ...nextData } = data
      res = {
        success: true,
        res: {
          data: {
            fans: fans.length,
            attentions: attentions.length,
            token: signToken({mobile, password}),
            ...nextData
          }
        }
      }
    }else {
      ctx.status = 401
      res = {
        success: false,
        res: {
          errMsg: '账号或密码错误'
        }
      }
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router