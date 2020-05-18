const Router = require('@koa/router')
const { MongoDB, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { _id } = ctx.query
  let res
  const db = await mongo.connect("special")
  const data = await db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      movie: 1
    }
  })
  .catch(err => {
    console.log(err)
    return err
  })

  if(!data) {
    console.log(err)
    ctx.status = 500
    ctx.body = JSON.stringify({
      success: false,
      res: {
        errMsg: "服务器错误"
      }
    })
  }else {
    const dataList = data ? 
    await mongo.connect("movie")
    .then(db => db.find({
      _id: { $in: [...data.movie] }
    }, {
      projection: { name: 1, poster: 1, glance: 1 }
    }))
    .then(data => data.toArray())
    .catch(err => {
      console.log(err)
      return false
    })
    : []

    if(dataList) {
        ctx.status = 200
      res = {
        success: true,
        res: {
          data: dataList
        }
      }
    }else {
      ctx.status = 500
      res = {
        success: false,
        res: {
          data: {
            errMsg: '服务器错误'
          }
        }
      }
    }
    ctx.body = JSON.stringify(res)
  }
})

module.exports = router