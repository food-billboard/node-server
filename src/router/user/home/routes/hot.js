const Router = require('@koa/router')
const { dealErr, Params, responseDataDeal, MovieModel, MOVIE_STATUS } = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {
  console.log(11111111)
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
      $match: {
        status: MOVIE_STATUS.COMPLETE
      }
    },
    {
      $sort: {
        createdAt: -1,
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
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router