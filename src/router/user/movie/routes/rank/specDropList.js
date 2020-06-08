const Router = require('@koa/router')
const { RankModel, dealErr, notFound } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const { count=8 } = ctx.query
  let res
  const data = await RankModel.find({})
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