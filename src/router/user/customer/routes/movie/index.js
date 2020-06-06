const Router = require('@koa/router')
const Browse = require('./browser')
const Store = require('./store')
const { UserModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    issue: 1,
    _id: 0
  })
  .populate({
    path: 'issue',
    select: {
      name: 1,
      poster: 1,
      hot: 1
    },
    options: {
      skip: pageSize * currPage,
      limit: pageSize,
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
.use('/browser', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router