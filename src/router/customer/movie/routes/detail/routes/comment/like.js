const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { id: 评论id }

router
.put('/', async (ctx) => {
  const { body: { _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg

  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("comment")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $inc: { total_like: 1 },
      $push: { like_person: userId }
    }))
  })
  .then(_ => {
    return mongo.connect("comment")
    .then(db => db.findOne({
      _id: mongo.dealId(_id)
    }, {
      projection: {
        user_info: 1
      }
    }))
  })
  .then(data => {
    const { user_info } = data
    return mongo.connect("user")
    .then(db => db.updateOne({
      _id: user_info
    }, {
      $inc: { hot: 1 }
    }))
  })
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
.delete('/', async(ctx) => {
  const { body: { _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    _id: 1
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("comment")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $inc: { total_like: -1 },
      $pull: { like_person: userId }
    }))
  })
  .then(_ => {
    return mongo.connect("comment")
    .then(db => db.findOne({
      _id: mongo.dealId(_id)
    }, {
      user_info: 1
    }))
  })
  .then(data => {
    const { user_info } = data
    return mongo.connect("user")
    .then(db => db.updateOne({
      _id: user_info
    }, {
      $inc: { hot: -1 }
    }))
  })
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