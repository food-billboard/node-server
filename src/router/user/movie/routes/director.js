const Router = require('@koa/router')
const { Params, DirectorModel, notFound, dealErr } = require('@src/utils')

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
  let res

  const data = await DirectorModel.find()
  .select({
    name: 1
  })
  .limit(count)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = {
      ...data.res
    }
  }else {
    res = {
      success: true,
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router