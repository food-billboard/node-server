const Router = require('@koa/router')
const { MongoDB, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  let res
  const [,data] = await withTry(mongo.find)('_global_', {
      query: [
        {
          __type__: 'sort',
          create_time: -1
        },
        [ 'limit', 1 ]
      ]
    }, { notice: 1 })
  
  if(!data) {
    ctx.status = 500
    res = {
      success: false,
      res: null
    }
  }else {
    res = {
      success: true,
      res: {
        data: dataList
      }
    }
  }
  ctx.body = JSON.stringify(res)
})

module.exports = router