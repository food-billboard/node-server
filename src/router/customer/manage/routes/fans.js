const Router = require('@koa/router')
const { MongoDB } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { id: 用户id, currPage: 当前页, pageSize: 数量 }

router.get('/', async (ctx) => {
  const { mobile, currPage, pageSize } = ctx.query
  let res
  const data = await mongo.findOne("_user_", {
    mobile,
    query: [ [ "limit", pageSize ], [ "skip", pageSize * currPage ] ]
  }, {
    fans: 1
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

module.exports = router