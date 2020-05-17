const Router = require('@koa/router')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { count=8 } = ctx.query
  let res
  const [, data] = await withTry(mongo.find)("rank", {//_rank_
    query: [ [ "limit", count ] ]
  }, {
    name: 1
  })
  if(!data) {
    res = {
      success: false,
      res: {
        errMsg: '服务器错误'
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