const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.put('/', async (ctx) => {
  const { body: { _id, value } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    rate: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { rate } = data
    const [rateValue] = rate.filter(r => ObjectId.isValid(r.id) ? r.id.equals(_id) : ObjectId(r.id).equals(_id))
    //修改评分
    if(rateValue) {
      return Promise.all([
        UserModel.updateOne({
          mobile: Number(mobile),
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
          mobile: Number(mobile)
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