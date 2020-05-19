const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { currPage: 当前页, pageSize: 数量 }

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage, pageSize } = ctx.query
  let res
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    limit: pageSize,
    skip: pageSize * currPage,
    projection: {
      fans: 1
    }
  }))
  .then(data => {
    return mongo.connect("user")
    .then(db => db.findOne({
      _id: { $in: [...data] }
    }, {
      projection: {
        username: 1,
        avatar: 1
      },
    }))
  })
  .catch(err => {
    errMsg = err
    return false
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