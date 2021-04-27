const Router = require('@koa/router')
const { verifyTokenToData, UserModel, MovieModel, dealErr, notFound, Params, isType, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.put('/', async (ctx) => {
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  }, {
    name: 'value',
    validator: [
      data => isType(data, 'number') || isType(data, 'string')
    ]
  })
  if(check) return

  const [ _id, value ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'value',
    type: [ 'toInt' ]
  })
  const [, token] = verifyTokenToData(ctx)
  const { id } = token

  const data = await Promise.all([
    UserModel.findOne({
      _id: ObjectId(id)
    })
    .select({
      rate: 1
    })
    .exec()
    .then(notFound),
    MovieModel.findOne({
      _id
    })
    .select({
      _id: 1
    })
    .exec()
    .then(notFound)
    .then(data => data._id)
  ])
  .then(([user, _]) => {
    const { rate } = user
    const [rateValue] = rate.filter(r => ObjectId.isValid(r._id) ? r._id.equals(_id) : ObjectId(r._id).equals(_id))
    //修改评分
    if(rateValue) {
      return Promise.all([
        UserModel.updateOne({
          _id: ObjectId(id),
          "rate._id": _id
        }, {
          $set: { "rate.$.rate": value }
        }),
        MovieModel.updateOne({
          _id,
        }, {
          $inc: { total_rate: -rateValue.rate + value }
        })
      ])
    }else {
      return Promise.all([
        UserModel.updateOne({
          _id: ObjectId(id)
        }, {
          $push: { rate: { _id, rate:value } }
        }),
        MovieModel.updateOne({
          _id
        }, {
          $inc: {
            total_rate: value,
            rate_person: 1 
          }
        })
      ])
    }
  })
  .then(_ => true)
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router