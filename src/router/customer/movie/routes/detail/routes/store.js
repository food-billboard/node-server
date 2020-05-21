const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.put('/', async (ctx) => {
  const { body: { _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg
  
  await mongo.connect("user")
  .then(db => db.updateOne({
    mobile: Number(mobile),
    store: { $ne: mongo.dealId(_id) }
  }, {
    $push: { store: mongo.dealId(_id) }
  }))
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
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.delete('/', async(ctx) => {
  const { _id } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg

  await mongo.connect("user")
  .then(db => db.updateOne({
    mobile: Number(mobile),
    store: { $in: [mongo.dealId(_id)] }
  }, {
    $pull: { store: mongo.dealId(_id) }
  }))
  .catch(err => {
    console.log(err)
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
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router