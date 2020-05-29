const Router = require('@koa/router')
const { MongoDB, encoded, signToken, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

function createInitialUserInfo({mobile, password}) {
  return {
    mobile,
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
    rate: [],
    allow_many: false,
    create_time: Date.now(),
    modified_time: Date.now(),
    status: 'SIGNIN',
  }
}

router
.post('/', async(ctx) => {
  const { body: { mobile, password } } = ctx.request
  let res
  let errMsg
  //判断账号是否存在
  const data = await mongo.connect("user")
  .then(db => db.findOne({mobile}, {projection: {mobile: 1}}))
  .catch(err => {
    errMsg = err
  })
  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    if(data) {
      ctx.status = 403
      res = {
        success: false,
        res: {
          errMsg: '账号已存在'
        }
      }
    }else {
      const data = await mongo.connect("user")
      .then(db => db.insertOne(createInitialUserInfo({mobile, password})))
      .catch(err => {
        console.log(err)
        errMsg = err
        return false
      })
      if(errMsg) {
        console.log(err)
        ctx.status = 500
        res = {
          success: false,
          res: {
            errMsg
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

module.exports = router