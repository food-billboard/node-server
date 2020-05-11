const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query
  let dataList
  try {
    dataList = await mongo.find('_search_', {
      query: [
        {
          __type__: 'sort',
          hot: -1
        },
        [ 'limit', count ]
      ]
    }, { key_word: 1 })
  }catch(_) {
    dataList = []
  }

  ctx.body = JSON.stringify({
    success: true,
    res: {
      data: dataList
    }
  })
})

module.exports = router