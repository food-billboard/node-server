const Router = require('@koa/router')
const { MongoDB, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query
  let res
  const [,dataList] = await withTry(mongo.find)('_search_', {
      query: [
        {
          __type__: 'sort',
          hot: -1
        },
        [ 'limit', count ]
      ]
    }, { key_word: 1 })
  if(!dataList) {
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