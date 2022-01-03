const Router = require('@koa/router')
const { RankModel, UserModel, dealErr, Params, responseDataDeal, commonAggregateMovie, verifyTokenToData, commonSeparateMovieFields } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const check = Params.query(ctx, {
    name: "_id",
    validator: [
			data => ObjectId.isValid(data)
		]
	})
	if(check) return

	const [ currPage, pageSize, _id, glance, author_rate, hot, rate_person, total_rate ] = Params.sanitizers(ctx.query, {
		name: 'currPage',
		_default: 0,
		type: [ 'toInt' ],
		sanitizers: [
      data => data >= 0 ? data : -1
    ]
	}, {
		name: 'pageSize',
		_default: 30,
		type: [ 'toInt' ],
		sanitizers: [
      data => data >= 0 ? data : -1
    ]
	}, {
		name: '_id',
		sanitizers: [
			function(data) {
				return ObjectId(data)
			}
		]
	},
	{
		name: 'glance',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'author_rate',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'hot',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'rate_person',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	},
	{
		name: 'total_rate',
		type: [ 'toInt' ],
		sanitizers: [
			function(data) {
				return Number.isNaN(data) ? 0 : 1
			}
		]
	})

  const [, token] = verifyTokenToData(ctx)
  const userId = ObjectId(token.id)

  const sortPipeline = {}
  if(glance) sortPipeline.glance = 1
  if(author_rate) sortPipeline.author_rate = 1
  if(hot) sortPipeline.hot = 1
  if(rate_person) sortPipeline.rate_person = 1
  if(total_rate) sortPipeline.total_rate = 1


  const data = await UserModel.findOne({
    _id: userId
  })
  .select({
    store: 1
  })
  .exec()
  .then(data => {
    return RankModel.aggregate([
      {
        $match: {
          _id 
        }
      },
      {
        $unwind: "$match"
      },
      {
        $lookup: {
          from: 'movies', 
          let: { movie_ids: "$match" },
          pipeline: [  
            {
              $match: {
                $expr: {
                  "$eq": [ "$_id", "$$movie_ids" ]
                },
              }
            },
            ...(Object.keys(sortPipeline).length ? [{
              $sort: sortPipeline
            }] : []),
            {
              $skip: currPage * pageSize 
            },
            {
              $limit: pageSize
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
            }
          ],
          as: 'match',
        }
      }, 
      {
        $unwind: "$match"
      },
      {
        $project: {
          ...commonSeparateMovieFields("match"),
          store: "$match.store"
        }
      }
    ])
  })
  .then(data => {
    return {
      data 
    }
  })
	.catch(dealErr(ctx))
  
	responseDataDeal({
		ctx,
		data
	})

  RankModel.updateOne({
    _id
  }, {
    $inc: { glance: 1 }
  })
  .catch(() => {})

})

module.exports = router