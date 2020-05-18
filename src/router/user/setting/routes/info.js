const Router = require('@koa/router')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  let res
  let errMsg
  const [, data] = await mongo.connect("global")
  .then(db => db.findOne({}, {
    sort: {
      create_time: -1
    },
    limit: 1,
    projection: {
      info: 1
    }
  }))
  .catch(err => {
    errMsg = err
  })
  if(errMsg) {
    res = {
      success: false,
      res: {
        errMsg
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