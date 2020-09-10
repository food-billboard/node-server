const Router = require('@koa/router')
const { RankModel, dealErr, notFound, responseDataDeal } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
		name: 'count',
		_default: 8,
		type: [ 'toInt' ]
	})

  let data = await RankModel.find({})
  .select({
    name: 1,
    icon: 1
  })
  .limit(count)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return data.map(d => {
      const { _doc: { icon, ...nextD } } = d
      return {
        ...nextD,
        icon: icon ? icon.src : null
      }
    })
  })
  .catch(dealErr(ctx))
  
  responseDataDeal({
    ctx,
    res
  })

})

module.exports = router