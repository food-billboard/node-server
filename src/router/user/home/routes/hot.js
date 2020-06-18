const Router = require('@koa/router')
const { SearchModel, dealErr, notFound, Params } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 3,
    type: ['toInt'],
    sanitizers: [
      data => data >= 0 ? data : -1
    ]
  })
  let res
  let data = await SearchModel.find({})
  .select({
    key_word: 1
  })
  .sort({
    hot: -1
  })
  data = count >= 0 ? data.limit(count) : data
  data = data.exec()
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