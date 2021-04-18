const Router = require('@koa/router')
const { SearchModel, dealErr, notFound, Params, responseDataDeal, MovieModel } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 3,
    type: ['toInt'],
    sanitizers: [
      data => data > 0 ? data : 0
    ]
  })

  const data = await MovieModel.aggregate([
    {
      $sort: {
        hot: -1
      }
    },
    {
      $limit: count
    },
    {
      $project: {
        name: 1,
      }
    }
  ])
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router