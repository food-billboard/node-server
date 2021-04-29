const Router = require('@koa/router')
const { ClassifyModel, dealErr, Params, responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async (ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
		name: 'currPage',
		_default: 12,
    type: [ 'toInt' ],
    sanitizers: [
      data => data > 0 ? data : 0
    ]
	})

  const data = await ClassifyModel.aggregate([
    {
      $limit: count
    },
    {
      $lookup: {
        from: 'images',
        as: 'icon',
        foreignField: "_id",
        localField: "icon"
      }
    },
    {
      $unwind: "$icon"
    },
    {
      $project: {
        _id: 1,
        icon: "$icon.src",
        name: 1,
        updatedAt: 1,
        key: 1
      }
    }
  ])
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
  })

})

module.exports = router