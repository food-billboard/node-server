const Router = require('@koa/router')
const { Params, ActorModel, notFound, dealErr, responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
		name: 'count',
		_default: 0,
		type: [ 'toInt' ],
		sanitizers: [
      data => data >= 0 ? data : -1
    ]
	})

  const data = await ActorModel.find()
  .select({
    name: 1,
    key: 1
  })
  .limit(count)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router