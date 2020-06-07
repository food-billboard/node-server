const Router = require('@koa/router')
const { GlobalModel, dealErr } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  let res
  const data = await GlobalModel.findOne({})
  .sort({
    createdAt: -1
  })
  .select({
    info: 1
  })
  .limit(1)
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // let errMsg
  // const data = await mongo.connect("global")
  // .then(db => db.findOne({}, {
  //   sort: {
  //     create_time: -1
  //   },
  //   limit: 1,
  //   projection: {
  //     info: 1
  //   }
  // }))
  // .catch(err => {
  //   errMsg = err
  // })

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