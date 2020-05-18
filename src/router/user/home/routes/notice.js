const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  let res
  const data = await mongo.connect("global")
  .then(db => db.findOne({}, {
    sort: {
      create_time: -1
    },
    projection: {
      notice: 1
    }
  }))
  .catch(err => {
    console.log(err)
    return false
  } )
  
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