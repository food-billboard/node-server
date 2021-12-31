const Router = require('@koa/router')
const { MovieModel, dealErr, MOVIE_STATUS, Params, responseDataDeal } = require('@src/utils')

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

  const data = await MovieModel.aggregate([
    {
      $match: {
        status: MOVIE_STATUS.COMPLETE
      }
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $limit: count
    },
    {
      $lookup: {
        from: 'images',
        localField: 'poster',
        foreignField: '_id',
        as: 'poster'
      }
    },
    {
      $unwind: {
        path: "$poster",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video'
      }
    },
    {
      $unwind: {
        path: "$video",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $project: {
        name: 1,
        poster: "$poster.src",
        _id: 1,
        author_rate: 1,
        createdAt: 1,
        video: "$video.src",
        author_description: 1
      }
    }
  ])
  .then(data => {
    return {
      data
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