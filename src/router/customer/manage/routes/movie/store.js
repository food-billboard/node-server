const Router = require('@koa/router')
const {  verifyTokenToData, UserModel, dealErr, notFound } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    store: 1
  })
  .populate({
    path: 'store',
    select: {
      "info.description": 1,
      "info.name": 1,
      poster: 1
    },
    options: {
      limit: pageSize,
      skip: pageSize * currPage,
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { store } = data
    return store.map(s => {
      const { _doc: { info: { description, name }, poster: { src }, ...nextD } } = s
      return {
        ...nextD,
        poster: src,
        description,
        name,
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