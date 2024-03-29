const Router = require('@koa/router')
const { GlobalModel, dealErr, notFound, responseDataDeal } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {

  const data = await GlobalModel.findOne({})
  .sort({
    createdAt: -1
  })
  .select({
    notice: 1,
    updatedAt: 1
  })
  .exec()
  .then(notFound)
  .then(data => ({ data }))
  .catch(dealErr(ctx))
  
  responseDataDeal({
    ctx,
    data
  })

})

module.exports = router