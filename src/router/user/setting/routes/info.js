const Router = require('@koa/router')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  ctx.body = '小程序信息'
  let res
  const [, data] = await withTry(mongo.find)("_global_", {
    query: [
      {
        __type__: 'sort',
        create_time: -1
      },
      ["limit", 1]
    ]
  }, {
    info: 1
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