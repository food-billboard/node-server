const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { currPage=0, pageSize=30 } = ctx.query
  const { mobile } = token
  let res

  const data = await UserModel.findOne({
    mobile: ~~mobile
  })
  .select({
    attentions: 1
  })
  .populate({
    path: 'attentions',
    select: {
      username: 1,
      avatar: 1
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage
    }
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // let errMsg
  // let numMobile = Number(mobile)
  // const data = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: numMobile,
  // }, {
  //   projection: {
  //     attentions: 1
  //   },
  //   limit: pageSize,
  //   skip: pageSize * currPage
  // }))
  // .then(data => {
  //   const { attentions } = data
  //   return mongo.connect("user")
  //   .then(db => db.find({
  //     _id: { $in: [...attentions.map(a => typeof a == 'object' ? a : mongo.dealId(a))] }
  //   }, {
  //     projection: {
  //       username: 1,
  //       avatar: 1
  //     }
  //   }))
  //   .then(data => data.toArray())
  // })
  // .catch(err => {
  //   errMsg = err
  //   console.log(err)
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
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
  let res

  const data = await UserModel.findOneAndUpdate({
    mobile: ~~mobile
  }, {
    $push: { attentions: ObjectId(_id) }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(id => {
    if(!id) return Promise.reject({ errMsg: '有问题', status: 403 })
    return UserModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $push: { fans: id }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  // const mineRes = await mongo.connect("user")
  // .then(db => db.updateOne({
  //   mobile: numMobile
  // }, {
  //   $push: { attentions: mongo.dealId(_id) }
  // }))
  // .catch(err => {
  //   console.log(err)
  //   return false
  // })
  // const userRes = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: numMobile
  // }, {
  //   projection: {
  //     _id: 1
  //   }
  // }))
  // .then(data => {
  //   const { _id:userId } = data
  //   return mongo.connect("user")
  //   .then(db => db.updateOne({
  //     _id: mongo.dealId(_id)
  //   }, {
  //     $push: { fans: userId }
  //   }))
  // })
  // .catch(err => {
  //   console.log(err)
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
  const [, token] = verifyTokenToData(ctx)
  const { _id  } = ctx.query
  const { mobile } = token
  let res
  const data = await UserModel.findOneAndUpdate({
    mobile: ~~mobile
  }, {
    $pull: { attentions: ObjectId(_id) }
  })
  .select({
    _id: 1
  })
  .exec()
  .then(data => !!data && data._id)
  .then(id => {
    if(!id) return Promise.reject({ status: 403, errMsg: '有问题' })
    return UserModel.updateOne({
      _id: ObjectId(_id)
    }, {
      $pull: { fans: id }
    })
    .then(_ => true)
  })
  .catch(dealErr(ctx))

  // let numMobile = Number(mobile)
  // let errMsg
  // const mineRes = await mongo.connect("user")
  // .then(db => db.updateOne({
  //   mobile: numMobile
  // }, {
  //   $pull: { attentions: mongo.dealId(_id) }
  // }))
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })
  // const userRes = await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: numMobile
  // }, {
  //   projection: {
  //     _id: 1
  //   }
  // }))
  // .then(data => {
  //   const { _id:userId } = data
  //   return mongo.connect("user")
  //   .then(db => db.updateOne({
  //     _id: mongo.dealId(_id)
  //   }, {
  //     $pull: { fans: userId }
  //   }))
  // })
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: false,
      res: null
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router