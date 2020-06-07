const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.put('/', async (ctx) => {
  const { body: { _id, value } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  const data = await UserModel.findOne({
    mobile: ~~mobile
  })
  .select({
    rate: 1
  })
  .exec()
  .then(data => {
    const { rate } = data
    const [rateValue] = rate.filter(r => ObjectId.isValid(r.id) ? r.id.equals(_id) : ObjectId(r.id).equals(_id))
    //修改评分
    if(rateValue) {
      return Promise.all([
        UserModel.updateOne({
          mobile: ~~mobile,
          "rate.$._id": ObjectId(_id) 
        }, {
          $set: { "rate.$.rate": ~~value }
        }),
        MovieModel.updateOne({
          _id: ObjectId(_id),
        }, {
          $inc: { total_rate: -rateValue.rate + ~~value }
        })
      ])
    }else {
      return Promise.all([
        UserModel.updateOne({
          mobile: ~~mobile
        }, {
          $push: { rate: { _id: ObjectId(_id), rate: ~~value } }
        }),
        MovieModel.updateOne({
          _id: ObjectId(_id)
        }, {
          $inc: {
            total_rate: ~~value,
            rate_person: 1 
          }
        })
      ])
    }
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  // let errMsg
  // let numMobile = Number(mobile)
  // let numValue = Number(value)
  // await mongo.connect("user")
  // .then(db => db.findOne({
  //   mobile: numMobile
  // }, {
  //   projection: {
  //     rate: 1
  //   }
  // }))
  // .then(data => {
  //   const { rate } = data
  //   const [rateValue] = rate.filter(r => mongo.equalId(r.id, _id))
  //   //修改评分
  //   if(rateValue) {
  //     return Promise.all([
  //       mongo.connect("user")
  //       .then(db => db.updateOne({
  //         mobile: numMobile,
  //         "rate.$.id": mongo.dealId(_id)
  //       }, {
  //         $set: { "rate.$.rate": numValue }
  //       })),
  //       mongo.connect("movie")
  //       .then(db => db.updateOne({
  //         _id: mongo.dealId(_id),
  //       }, {
  //         $inc: { total_rate: -rateValue.rate+numValue }
  //       }))
  //     ])
  //   }else {
  //     return Promise.all([
  //       mongo.connect("user")
  //       .then(db => db.updateOne({
  //         mobile: numMobile
  //       }, {
  //         $push: { rate: { id: mongo.dealId(_id), rate: numValue } }
  //       })),
  //       mongo.connect("movie")
  //       .then(db => db.updateOne({
  //         _id: mongo.dealId(_id)
  //       }, {
  //         $inc: { 
  //           total_rate: numValue,
  //           rate_person: 1 
  //         }
  //       }))
  //     ])
  //   }
  // })
  // .then(_ => {
  //   return true
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
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router