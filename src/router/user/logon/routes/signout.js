const Router = require('@koa/router')
const { MongoDB, verifyTokenToData, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  if(!token) {
    ctx.status = 401
    res = {
      success: false,
      res: null
    }
  }else {
    const { mobile } = token
    const [err, data] = await withTry(mongo.updateOne)("_user_", {
      mobile
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
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router