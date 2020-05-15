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
  const data = await mongo.findOne("_user_", {
    mobile,
    query: [ [ "limit", pageSize ], [ "skip", pageSize * currPage ] ]
  }, {
    attentions: 1
  }).then(data => {
    return mongo.find("_user_", {
      mobile: { $in: [...data] }
    })
  }, {
    username: 1,
    avatar: 1
  })
  .catch(err => {
    console.log("获取关注错误", err)
    return false
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
      res: {
        data: data
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
  const [, mineRes] = await withTry(mongo.updateOne)("_user_", {
    mobile
  }, {
    $push: { attentions: _id } 
  })
  const userRes = await mongo.findOne("_user_", {
    mobile
  }, {
    _id: 1
  })
  .then(data => {
    const { _id:userId } = data
    return mongo.updateOne("_user_", {
      _id: mongo.dealId(_id)
    }, {
      $push: { fans: userId }
    })
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
  const [, mineRes] = await withTry(mongo.updateOne)("_user_", {
    mobile
  }, {
    $pull: { attentions: _id } 
  })
  const userRes = await mongo.findOne("_user_", {
    mobile
  }, {
    _id: 1
  })
  .then(data => {
    const { _id:userId } = data
    return mongo.updateOne("_user_", {
      _id: mongo.dealId(_id)
    }, {
      $pull: { fans: userId }
    })
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