const Router = require('@koa/router')
const { UserModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    store: 1,
    _id: 0
  })
  .populate({
    path: 'store',
    options: {
      limit: pageSize,
      skip: pageSize * currPage,
    },
    select: {
      "info.description": 1,
      "info.name": 1,
      poster: 1
    }
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  if(data && !data.err) {
    res = {
      success: true,
      res: {
        data
      }
    }
  }else {
    res = {
      ...data.res
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router