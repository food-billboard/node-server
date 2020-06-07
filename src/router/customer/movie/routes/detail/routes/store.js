const Router = require('@koa/router')
const { UserModel, MovieModel, verifyTokenToData, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require("mongoose")

const router = new Router()

router
.put('/', async (ctx) => {
  const { body: { _id } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res

  const data = await UserModel.updateOne({
    mobile: ~~mobile,
    store: { $ne: ObjectId(_id) }
  }, {
    $push: { store: ObjectId(_id) }
  })
  .then(_ => {
    return MovieModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $inc: { hot: 1 }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))
  
  // await mongo.connect("user")
  // .then(db => db.updateOne({
  //   mobile: Number(mobile),
  //   store: { $ne: mongo.dealId(_id) }
  // }, {
  //   $push: { store: mongo.dealId(_id) }
  // }))
  // .catch(err => {
  //   errMsg = err
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
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

  const data = await UserModel.updateOne({
    mobile: ~~mobile,
    store: { $in: [ObjectId(_id)] }
  }, {
    $pull: { store: ObjectId(_id) }
  })
  .exec()
  .then(data => {
    if(data && data.nModified == 0) return Promise.reject({ errMsg: 'no store', status: 403 })
    return MovieModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $inc: { hot: -1 }
    })
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  // let errMsg

  // await mongo.connect("user")
  // .then(db => db.updateOne({
  //   mobile: Number(mobile),
  //   store: { $in: [mongo.dealId(_id)] }
  // }, {
  //   $pull: { store: mongo.dealId(_id) }
  // }))
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

  // if(errMsg) {
  //   ctx.status = 500
  //   res = {
  //     success: false,
  //     res: {
  //       errMsg
  //     }
  //   }
  // }else {
  //   res = {
  //     success: true,
  //     res: null
  //   }
  // }

  ctx.body = JSON.stringify(res)
})

module.exports = router