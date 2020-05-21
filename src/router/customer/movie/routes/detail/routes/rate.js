const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// ata: { id: 电影id,  value: 分数 }

router.put('/', async (ctx) => {
  ctx.body = '评分'
  const { body: { _id, value } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      rate: 1
    }
  }))
  .then(data => {
    const { rate } = data
    const [rateValue] = rate.filter(r => r.id == mongo.dealId(_id))
    //修改评分
    if(rateValue) {
      return Promise.all([
        mongo.connect("user")
        .then(db => db.updateOne({
          mobile,
          "rate.$.id": _id
        }, {
          "rate.$.rate": value
        })),
        mongo.connect("movie")
        .then(db => db.updateOne({
          _id: mongo.dealId(_id),
        }, {
          $inc: { total_rate: -rateValue.rate+value }
        }))
      ])
    }else {
      return Promise.all([
        mongo.connect("user")
        .then(db => db.updateOne({
          mobile
        }, {
          $push: { rate: { id: mongo.dealId(_id), rate: value } }
        })),
        mongo.connect("movie")
        .then(db => db.updateOne({
          _id: mongo.dealId(_id)
        }, {
          $inc: { 
            total_rate: value,
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