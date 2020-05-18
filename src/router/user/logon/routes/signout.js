const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  let errMsg
  if(!token) {
    ctx.status = 401
    res = {
      success: false,
      res: null
    }
  }else {
    const { mobile } = token
    const data = await mongo.connect("user")
    .then(db => db.updateOne({
      mobile: Number(mobile)
    }, {
      $set: { status: "SIGNOUT" }
    }))
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