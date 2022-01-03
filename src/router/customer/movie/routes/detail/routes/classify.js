const Router = require('@koa/router')
const { UserModel, dealErr, MovieModel, Params, responseDataDeal, verifyTokenToData, commonAggregateMovie } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
      data => ObjectId.isValid(data)
    ]
  })
  if(check) return

  const [ _id ] = Params.sanitizers(ctx.query, {
		name: '_id',
		sanitizers: [
			function(data) {
				return ObjectId(data)
			}
		]
  })
  
  const [, token] = verifyTokenToData(ctx)
  const userId = ObjectId(token.id)

  const data = await UserModel.findOne({
    _id: userId
  })
  .select({
    store: 1
  })
  .exec()
  .then(data => {
    return   MovieModel.aggregate([
      {
        $match: {
          "info.classify": {
            $in: [_id]
          },
        }
      },
      {
        $addFields: {
          store: {
            $cond: [
              {
                $in: [
                  "$_id", data.store.map(item => item._id)
                ]
              },
              true,
              false 
            ]
          }
        }
      },
      ...commonAggregateMovie.slice(0, -1),
      {
        $project: {
          ...commonAggregateMovie[commonAggregateMovie.length - 1].$project,
          store: "$store" 
        }
      },
    ])
  })
  .then(data => {
    return {
      data: data
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
module.exports = router