const Router = require('@koa/router')
const { SpecialModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async(ctx) => {
  const check = Params.get(ctx, {
    name: '_id',
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

  const data = await SpecialModel.findOne({
    _id
  })
  .select({
    movie: 1,
    poster: 1,
    name: 1,
    updatedAt: 1,
    // hot: 1,
    // author_rate: 1,
  })
  .populate({
    path: 'movie',
    select: {
      "info.classify": 1,
			"info.description": 1,
			"info.name": 1,
			poster: 1,
			publish_time: 1,
			hot: 1,
			// author_rate: 1,
			rate: 1,
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { poster, movie, ...nextData } = data
    return {
      ...nextData,
      poster: poster ? poster.src : null,
      movie: movie.map(m => {
        const { _doc: { poster, info: { classify, description, name }, ...nextM } } = m
        return {
          ...nextM,
          description,
          name,
          classify,
          store: false,
          poster: poster ? poster.src : null,
        }
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
module.exports = router