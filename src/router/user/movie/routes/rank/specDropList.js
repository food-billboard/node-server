const Router = require('@koa/router')
const { RankModel, dealErr, notFound } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
		name: 'count',
		_default: 8,
		type: [ 'toInt' ]
	})
  let res
  let data = await RankModel.find({})
  .select({
    name: 1,
    icon: 1
  })
  data = count >= 0 ? data.limit(count) : data
  data = data.exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return data.map(d => {
      const { _doc: { icon: { src }={}, ...nextD } } = d
      return {
        ...nextD,
        icon: src || null
      }
    })
  })
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