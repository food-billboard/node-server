const Router = require('@koa/router')
const { SpecialModel, dealErr, notFound, Params, responseDataDeal, verifyTokenToData, avatarGet } = require('@src/utils')
const { merge, omit, pick } = require('lodash')
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
  let pushData = { timestamps: Date.now() }
  if(token) pushData = { ...pushData, _id: token.id }

  const data = await SpecialModel.findOneAndUpdate({
    _id
  }, {
    $push: { glance: pushData }
  })
  .select({
    movie: 1,
    poster: 1,
    name: 1,
    updatedAt: 1,
  })
  .populate({
    path: 'movie',
    select: {
      "info.classify": 1,
			"info.description": 1,
      "info.name": 1,
      "info.screen_time": 1,
			poster: 1,
			hot: 1,
      total_rate: 1,
      rate_person: 1,
      author: 1,
    },
    populate: [
      {
        path: 'info.classify',
        select: {
          _id: 0,
          name: 1
        },
      },
      {
        path: 'author',
        select: {
          username: 1,
          avatar: 1
        },
      }
    ],

  })
  .exec()
  .then(notFound)
  .then(data => {
    const { poster, movie, ...nextData } = data
    return {
      data: {
        ...nextData,
        poster: poster ? poster.src : null,
        movie: movie.map(m => {
          const { poster, author, info: { classify, description, name, screen_time }, total_rate, rate_person, ...nextM } = m
          const rate = total_rate / rate_person
          return {
            ...nextM,
            description,
            name,
            classify,
            store: false,
            poster: poster ? poster.src : null,
            publish_time: screen_time,
            rate: Number.isNaN(rate) ? 0 : parseFloat(rate).toFixed(1),
            author: merge({}, omit(author || {}, [ 'avatar' ]), avatarGet(pick(author || {}, ['avatar'])))
          }
        })
      }
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
module.exports = router