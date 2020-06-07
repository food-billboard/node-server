const Router = require('@koa/router')
const { SearchModel, dealErr } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query
  let res
  const data = await SearchModel.find({})
  .select({
    key_word: 1
  })
  .sort({
    hot: -1
  })
  .limit(count)
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // const data = await mongo.connect("search")
  // .then(db => db.find({}, 
  //   {
  //     sort: {
  //       hot: -1
  //     },
  //     limit: count,
  //     projection: {
  //       key_word: 1
  //     }
  //   })
  // )
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