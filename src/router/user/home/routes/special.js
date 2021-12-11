const Router = require('@koa/router')
const { SpecialModel, dealErr, Params, responseDataDeal, commonAggregateMovie } = require('@src/utils')
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

  const data = await SpecialModel.aggregate([
    {
      $match: {
        _id,
        valid: true 
      }
    },
    {
      $lookup: {
        from: 'images',
        as: 'poster',
        foreignField: "_id",
        localField: "poster"
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
        from: 'movies', 
        let: { movie_ids: "$movie" },
        pipeline: [  
          {
            $match: {
              $expr: {
                "$in": [ "$_id", "$$movie_ids" ]
              },
            }
          },
          {
            $addFields: {
              store: {
                $cond: [
                  0,
                  false,
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
          }
        ],
        as: 'movie_data',
      }
    }, 
    {
      $project: {
        poster: "$poster.src",
        name: 1,
        movie: "$movie_data",
        updatedAt: 1,
        _id: 1
      }
    }
  ])
  .then(data => {
    if(!data.length) return Promise.reject({ errMsg: "not found", status: 404 })
    return {
      data: data[0]
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})
module.exports = router