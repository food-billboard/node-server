const Router = require('@koa/router')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { count=8 } = ctx.query
  let res
  let errMsg
  const data = await mongo.connect("rank")
  .then(db => db.find({}, {
	  limit: count,
	  projection: {
      name: 1,
      icon: 1
	  }
  }))
  .then(data => data.toArray())
  .catch(err => {
	errMsg = err
	return false
  })
  
  if(errMsg) {
    res = {
      success: false,
      res: {
        errMsg
      }
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