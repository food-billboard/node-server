const Router = require('@koa/router')
const { SearchModel, dealErr, notFound, Params, responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const [ count ] = Params.sanitizers(ctx.query, {
    name: 'count',
    _default: 3,
    type: ['toInt'],
    sanitizers: [
      data => data > 0 ? data : 0
    ]
  })

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

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})

module.exports = router