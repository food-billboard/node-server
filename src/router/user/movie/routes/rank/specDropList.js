const Router = require('@koa/router')
const { RankModel, dealErr } = require("@src/utils")

const router = new Router()

router.get('/', async (ctx) => {
  const { count=8 } = ctx.query
  let res
  const data = await RankModel.find({})
  .select({
    name: 1,
    icon: 1
  })
  .limit(count)
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // let errMsg
  // const data = await mongo.connect("rank")
  // .then(db => db.find({}, {
	//   limit: count,
	//   projection: {
  //     name: 1,
  //     icon: 1
	//   }
  // }))
  // .then(data => data.toArray())
  // .catch(err => {
	// errMsg = err
	// return false
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