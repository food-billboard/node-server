const Router = require('@koa/router')
const { MongoDB, withTry, encoded, signToken } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

function createInitialUserInfo({mobile, password}) {
  return {
    mobile: mobile,
    password: encoded(password),
    avatar: '默认头像',
    hot: 0,
    username: '',
    fans: [],
    attention: [],
    issue: [],
    glance: [],
    comment: [],
    store: [],
    allow_many: false,
    create_time: Date.now(),
    modified_time: Date.now(),
    status: 'SIGNIN'
  }
}

router
.post('/', async(ctx) => {
  const { body: { mobile, password } } = ctx.request
  let res
  //判断账号是否存在
  const [, data] = await withTry(mongo.find)("_user_", {}, {
    mobile: 1
  })
  if(!data) {
    ctx.status = 500
    res = {
      success: false,
      res: null
    }
  }else {
    const result = data.filter(d => d == mobile)
    if(result.length) {
      res = {
        success: false,
        res: {
          errMsg: '账号已存在'
        }
      }
    }else {
      const [, data] = await withTry(mongo.insert)("_user_", createInitialUserInfo({mobile, password}))
      if(!data) {
        ctx.status = 500
        res = {
          success: false,
          res: {
            errMsg: '服务器错误'
          }
        }
      }else {
        const { ops } = data
        const { _id } = ops[0]
        res = {
          success: true,
          res: {
            avatar: '默认头像',
            fans:0,
            attention:0,
            hot: 0,
            _id,
            token: signToken({mobile, password})
          }
        }
      }
    }
  }

  ctx.body = JSON.stringify(res)
  
})
.get('/', async (ctx) => {
  mongo.insert("hello", {name: '妖怪3号', age: 1000}).then(res => {
    console.log(res)
  })
})

module.exports = router