const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query
  let res
  const data = await mongo.connect("search")
  .then(db => db.find({}, 
    {
      sort: {
        hot: -1
      },
      limit: count,
      projection: {
        key_word: 1
      }
    })
  )
  .then(data => data.toArray())
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) {
    ctx.status = 500
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