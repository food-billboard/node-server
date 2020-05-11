const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  let data 
  try {
    data = await mongo.find('_global_', {
      query: [
        {
          __type__: 'sort',
          create_time: -1
        },
        [ 'limit', 1 ]
      ]
    }, { notice: 1 })
  }catch(_) {
    data = '欢迎各位光临'
  }
  ctx.body = JSON.stringify({
    success: true,
    res: {
      notice: data
    }
  })
})

module.exports = router