const Router = require('@koa/router')
const { MongoDB, verifyToken, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.use(verifyToken())
.post('/', async(ctx) => {
  const { body: {_id} } = ctx.request
  let res
  const [err, data] = await withTry(mongo.updateOne)("_user_", {
    _id: mongo.dealId(_id)
  }, 
  {
    $set: { status: "SIGNOUT" }
  })
  if(err) {
    ctx.status = 500
    res = {
      success: false,
      res: null
    }
  }else {
    if(!data) {
      ctx.status = 401
      res = {
        success: false,
        res: null
      }
    }else {
      ctx.status = 200
      res = {
        success: true,
        res: null
      }
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router