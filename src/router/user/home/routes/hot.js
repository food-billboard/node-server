const Router = require('@koa/router')
const { SearchModel, dealErr, notFound } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query
  let res
  const data = await SearchModel.find({})
  .select({
    key_word: 1
  })
  .sort({
    hot: -1
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