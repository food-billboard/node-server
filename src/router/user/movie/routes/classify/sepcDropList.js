const Router = require('@koa/router')
const { ClassifyModel, dealErr } = require('@src/utils')

const router = new Router()

router.get('/', async (ctx) => {
  const { count=12 } = ctx.query
  let res
  const data = await ClassifyModel.find({})
  .select({
    name: 1,
		poster: 1
  })
  .limit(count)
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))


  // const data = await mongo.connect("classify")
  // .then(db => db.find({}, {
	//   limit: count,
	//   projection: {
	// 	  name: 1,
	// 	  poster: 1
	//   }
  // }))
  // .then(data => data.toArray())
  // .catch(err => {
  //   console.log(err)
  //   errMsg = err
  //   return false
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