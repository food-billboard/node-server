const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, Params, responseDataDeal } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    type: ['isMongoId']
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

  const data = await MovieModel.findOne({
    _id
  })
  .select({
    poster: 1,
    name: 1,
    updatedAt: 1,
    "info.description": 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { poster, info: { description }, ...nextData } = data
    return {
      ...nextData,
      poster: poster ? poster.src : null,
      description
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router