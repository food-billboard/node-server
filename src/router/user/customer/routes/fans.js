const Router = require('@koa/router')
const { UserModel, dealErr } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const router = new Router()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  let errMsg
  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    fans: 1,
    _id: 0
  })
  .populate({
    path: 'fans',
    select: {
      username: 1,
      avatar: 1
    },
    options: { limit: pageSize, skip: pageSize * currPage }
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