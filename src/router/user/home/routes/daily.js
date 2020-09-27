const Router = require('@koa/router')
const { MovieModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 12,
    type: ['toInt'],
    sanitizers: [
      data => data > 0 ? data : 0
    ]
  })

  const data = await MovieModel.find({})
  .select({
    name: 1, 
    poster: 1,
  })
  .sort({
    createdAt: -1
  })
  .limit(count)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return {
      data: data.map(d => {
        const { _doc: { poster, ...nextD } } = d
        return {
          ...nextD,
          poster: poster ? poster.src : null
        }
      })
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
})

module.exports = router