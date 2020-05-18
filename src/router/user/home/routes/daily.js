const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=12 } = ctx.query
  let res
  const dataList = await mongo.connect("movie")
  .then(db => {
    return db.find({}, {
      sort: {
        create_time: -1
      },
      limit: count,
      projection: {
        name: 1, 
        poster: 1
      }
    })
  })
  .then(data => data.toArray())
  .catch(err => {
    console.log(err)
    return false
  })

  if(!dataList) {
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
        data: dataList
      }
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router