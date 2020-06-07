const Router = require('@koa/router')
const { MovieModel, dealErr } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const { count=12 } = ctx.query
  let res
  const data = await MovieModel.find({})
  .select({
    name: 1, 
    poster: 1
  })
  .sort({
    createdAt: -1
  })
  .limit(count)
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // const dataList = await mongo.connect("movie")
  // .then(db => {
  //   return db.find({}, {
  //     sort: {
  //       create_time: -1
  //     },
  //     limit: count,
  //     projection: {
  //       name: 1, 
  //       poster: 1
  //     }
  //   })
  // })
  // .then(data => data.toArray())
  // .catch(err => {
  //   console.log(err)
  //   return false
  // })

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