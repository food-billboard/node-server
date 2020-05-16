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

  const data = await mongo.findOne("_user_", {
    mobile
  }, {
    _id: 1
  })
  .then(data => {
    const { _id:userId } = data
    mongo.updateOne("_comment_", {
      _id: mongo.dealId(_id)
    }, {
      $inc: { total_like: 1 },
      $push: { like_person: userId }
    })
  })
  .then(_ => {
    return mongo.findOne("_comment_", {
      _id: mongo.dealId(_id)
    }, {
      user_info: 1
    })
  })
  .then(data => {
    const { user_info } = data
    return mongo.updateOne("_user_", {
      _id: user_info
    }, {
      $inc: { hot: 1 }
    })
  })
  .catch(err => {
    console.log(err)
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

  const data = await mongo.findOne("_user_", {
    mobile
  }, {
    _id: 1
  })
  .then(data => {
    const { _id:userId } = data
    mongo.updateOne("_comment_", {
      _id: mongo.dealId(_id)
    }, {
      $inc: { total_like: -1 },
      $pull: { like_person: userId }
    })
  })
  .then(_ => {
    return mongo.findOne("_comment_", {
      _id: mongo.dealId(_id)
    }, {
      user_info: 1
    })
  })
  .then(data => {
    const { user_info } = data
    return mongo.updateOne("_user_", {
      _id: user_info
    }, {
      $inc: { hot: -1 }
    })
  })
  .catch(err => {
    console.log(err)
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
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router