const Router = require('@koa/router')
const { GlobalModel, dealErr, notFound, responseDataDeal } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {

  const data = await GlobalModel.findOne({})
  .sort({
    createdAt: -1
  })
  .select({
    info: 1,
    updatedAt: 1,
    _id: 0
  })
  .limit(1)
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data
  })
})

module.exports = router