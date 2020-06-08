const Router = require('@koa/router')
const { GlobalModel, dealErr, notFound } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  let res
  const data = await GlobalModel.findOne({})
  .sort({
    createdAt: -1
  })
  .select({
    info: 1,
    _id: 0
  })
  .limit(1)
  .exec()
  .then(data => !!data && data._doc)
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