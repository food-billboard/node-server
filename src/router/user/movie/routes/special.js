const Router = require('@koa/router')
const { SpecialModel, dealErr, Params, responseDataDeal } = require("@src/utils")

const router = new Router()

router
.get('/', async (ctx) => {

	const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
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
	})

	const data = await SpecialModel.aggregate([
    {
      $match: {
        valid: true 
      }
    },
    {
      $skip: currPage * pageSize 
    },
    {
      $limit: pageSize 
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
        path: "$info.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $project: {
        _id: 1,
        description: 1,
        name: 1,
        glance_count: 1,
        poster: "$poster.src",
        createdAt: 1,
        updatedAt: 1,
        movie_count: {
          $size: {
            $ifNull: [
              "$movie", []
            ]
          }
        }
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
		data
	})
})

module.exports = router