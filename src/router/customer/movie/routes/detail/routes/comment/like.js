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
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("comment")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id),
      like_person: { $nin: [userId] } 
    }, {
      $inc: { total_like: 1 },
      $addToSet: { like_person: userId }
    }))
  })
  .then(data => {
    if(data && data.result && data.result.nModified == 0) return Promise.reject()
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
  const { _id } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    _id: 1
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("comment")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id),
      like_person: { $in: [userId] } 
    }, {
      $inc: { total_like: -1 },
      $pull: { like_person: userId }
    }))
  })
  .then(data => {
    if(data && data.result && data.result.nModified == 0) return Promise.reject()
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