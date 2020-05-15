const Router = require('@koa/router')
const { MongoDB, verifyTokenToData, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// data: { id: 电影id }

router
.put('/', async (ctx) => {
  const { body: { _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const [, data] = await withTry(mongo.updateOne)("_user_", {
    mobile,
    rate: { $ne: mongo.dealId(_id) }
  }, {
    $push: { rate: mongo.dealId(_id) }
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
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.delete('/', async(ctx) => {
  const { body: { _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const [, data] = await withTry(mongo.updateOne)("_user_", {
    mobile,
    rate: { $in: [mongo.dealId(_id)] }
  }, {
    $pull: { rate: mongo.dealId(_id) }
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
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router