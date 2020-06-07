const Router = require('@koa/router')
const { GlobalModel, dealErr } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  let res
  const data = await GlobalModel.findOne({})
  .sort({
    createdAt: -1
  })
  .select({
    notice: 1
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // const data = await mongo.connect("global")
  // .then(db => db.findOne({}, {
  //   sort: {
  //     create_time: -1
  //   },
  //   projection: {
  //     notice: 1
  //   }
  // }))
  // .catch(err => {
  //   console.log(err)
  //   return false
  // } )
  
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