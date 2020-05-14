const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {

  const { count=12 } = ctx.query
  let dataList
  try {
    dataList = await mongo.find('_movie_', {
      query: [
        {
          __type__: 'sort',
          create_time: -1
        },
        [ 'limit', count ]
      ]
    }, {name: 1, poster: 1})
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