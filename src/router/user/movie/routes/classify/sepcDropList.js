const Router = require('@koa/router')
const { MongoDB, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { count=12 } = ctx.query
  let res
  const [, result] = await withTry(mongo.find)('classify', {
    query: [['limit', count]]
  }, {
    name: 1,
    poster: 1
  })
  if(!result) {
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
        data: result
      }
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router