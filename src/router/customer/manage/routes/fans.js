const Router = require('@koa/router')
const { verifyTokenToData, UserModel, dealErr, notFound } = require("@src/utils")

const router = new Router()

router
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { currPage=0, pageSize=30 } = ctx.query
  let res

  const data = await UserModel.findOne({
    mobile: Number(mobile)
  })
  .select({
    fans: 1
  })
  .populate({
    path: 'fans',
    options: {
      limit: pageSize,
      skip: currPage * pageSize
    },
    select: {
      username: 1,
      avatar: 1
    }
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => {
    const { fans } = data
    return fans.map(f => {
      const { _doc: { avatar: { src }, ...nextF } } = f
      return {
        avatar: src,
        ...nextF
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