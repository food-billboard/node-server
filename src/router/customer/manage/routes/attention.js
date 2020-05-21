const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { currPage=0, pageSize=30 } = ctx.query
  const { mobile } = token
  let res
  let errMsg
  let numMobile = Number(mobile)
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: numMobile,
  }, {
    projection: {
      attentions: 1
    },
    limit: pageSize,
    skip: pageSize * currPage
  }))
  .then(data => {
    const { attentions } = data
    return mongo.connect("user")
    .then(db => db.find({
      _id: { $in: [...attentions.map(a => typeof a == 'object' ? a : mongo.dealId(a))] }
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
    console.log(err)
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
  const [, token] = verifyTokenToData(ctx)
  const { body: { _id } } = ctx.request
  const { mobile } = token
  const numMobile = Number(mobile)
  let res
  const mineRes = await mongo.connect("user")
  .then(db => db.updateOne({
    mobile: numMobile
  }, {
    $push: { attentions: mongo.dealId(_id) }
  }))
  .catch(err => {
    console.log(err)
    return false
  })
  const userRes = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: numMobile
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
  const [, token] = verifyTokenToData(ctx)
  const { _id  } = ctx.query
  const { mobile } = token
  let numMobile = Number(mobile)
  let res
  let errMsg
  const mineRes = await mongo.connect("user")
  .then(db => db.updateOne({
    mobile: numMobile
  }, {
    $pull: { attentions: mongo.dealId(_id) }
  }))
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })
  const userRes = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: numMobile
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
      $pull: { fans: userId }
    }))
  })
  .catch(err => {
    console.log(err)
    errMsg = err
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