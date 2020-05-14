const Router = require('@koa/router')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { count } = ctx.query
  let res
  const [, data] = await withTry(mongo.find)("_rank_", {
    query: [ [ "limit", count ] ]
  })
  if(!data) {
    res = {
      success: false,
      res: null
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