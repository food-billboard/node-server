const Router = require('@koa/router')
const { MongoDB, withTry, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { currPage, pageSize } = ctx.query
  const { mobile } = token
  let res
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile,
  }, {
    projection: {
      attentions: 1
    },
    limit: pageSize,
    skip: pageSize * currPage
  }))
  .then(data => {
    return mongo.connect("user")
    .then(db => db.find({
      mobile: { $in: [...data] }
    }, {
      projection: {
        username: 1,
        avatar: 1
      }
    }))
    .then(data => data.toArray())
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
        data
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.put('/', async (ctx) => {
  const [, token] = verifyTokenToData
  const { body: { _id } } = ctx.request
  const { mobile } = token
  let res
  const mineRes = await mongo.connect("user")
  .then(db => db.updateOne({
    mobile
  }, {
    $push: { attentions: _id }
  }))
  .catch(err => {
    console.log(err)
    return false
  })
  const userRes = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("user")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $push: { fans: userId }
    }))
  })
  .catch(err => {
    console.log(err)
    return false
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
.delete('/', async(ctx) => {
  const [, token] = verifyTokenToData
  const { body: { _id } } = ctx.request
  const { mobile } = token
  let res
  const mineRes = await mongo.connect("user")
  .then(db => db.updateOne({
    mobile
  }, {
    $push: { attentions: _id }
  }))
  const userRes = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:userId } = data
    return mongo.connect("user")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $push: { fans: userId }
    }))
  })
  .catch(err => {
    console.log(err)
    return false
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