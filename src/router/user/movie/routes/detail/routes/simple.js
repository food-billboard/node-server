const Router = require('@koa/router')
const { MongoDB } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { _id } = ctx.query
  let res
  let errMsg
  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      poster: 1,
      name: 1,
      "info.description": 1
    }
  }))
  .catch(err => {
    errMsg = err
    return false
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