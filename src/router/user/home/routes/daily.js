const Router = require('@koa/router')
const { MovieModel, dealErr, notFound } = require('@src/utils')

const router = new Router()

router
.get('/', async(ctx) => {
  const { count=12 } = ctx.query
  let res
  const data = await MovieModel.find({})
  .select({
    name: 1, 
    poster: 1
  })
  .sort({
    createdAt: -1
  })
  .limit(count)
  .exec()
  .then(data => !!data && data)
  .then(notFound)
  .then(data => {
    return data.map(d => {
      const { _doc: { poster: { src }, ...nextD } } = d
      return {
        ...nextD,
        poster: src
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