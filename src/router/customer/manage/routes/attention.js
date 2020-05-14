const Router = require('@koa/router')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// 关注params: { id: 用户id, user: 个人id }

router
.get('/', async (ctx) => {
  const { mobile, currPage, pageSize } = ctx.query
  let res
  const data = await mongo.findOne("_user_", {
    mobile,
    query: [ [ "limit", pageSize ], [ "skip", pageSize * currPage ] ]
  }, {
    attentions: 1
  }).then(data => {
    return mongo.find("_user_", {
      mobile: { $in: [...data] }
    })
  }, {
    username: 1,
    avatar: 1
  })
  .catch(err => {
    console.log("获取关注错误", err)
    return false
  })

  if(!data) {
    ctx.status = 500
    res = {
      success: false,
      res: null
    }
  }else {
    res = {
      success: true,
      res: {
        data: data
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.put('/', async (ctx) => {
  const { body: { user, mine } } = ctx.request
  let res
  const [, mineRes] = await withTry(mongo.updateOne)("_user_", {
    mobile: '个人的账号'
  }, {
    $push: { attentions: '用户账号' } 
  })
  const [, userRes] = await withTry(mongo.updateOne)("_user_", {
    mobile: '用户账号'
  }, {
    $push: { fans: '个人账号' }
  })

  if(mineRes && userRes) {
    res = {
      success: true,
      res:null
    }
  }else {
    ctx.status = 500
    res = {
      success: false,
      res: null
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router