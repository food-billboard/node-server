const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.put('/', async (ctx) => {
  const { body: { _id, value } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg
  let numMobile = Number(mobile)
  let numValue = Number(value)
  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: numMobile
  }, {
    projection: {
      rate: 1
    }
  }))
  .then(data => {
    const { rate } = data
    const [rateValue] = rate.filter(r => r.id.toString() == _id)
    //修改评分
    if(rateValue) {
      return Promise.all([
        mongo.connect("user")
        .then(db => db.updateOne({
          mobile: numMobile,
          "rate.$.id": mongo.dealId(_id)
        }, {
          $set: { "rate.$.rate": numValue }
        })),
        mongo.connect("movie")
        .then(db => db.updateOne({
          _id: mongo.dealId(_id),
        }, {
          $inc: { total_rate: -rateValue.rate+numValue }
        }))
      ])
    }else {
      return Promise.all([
        mongo.connect("user")
        .then(db => db.updateOne({
          mobile: numMobile
        }, {
          $push: { rate: { id: mongo.dealId(_id), rate: numValue } }
        })),
        mongo.connect("movie")
        .then(db => db.updateOne({
          _id: mongo.dealId(_id)
        }, {
          $inc: { 
            total_rate: numValue,
            rate_person: 1 
          }
        }))
      ])
    }
  })
  .then(_ => {
    return true
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