const Router = require('@koa/router')
const { MongoDB, isType } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      fans: 1
    }
  }))
  .then(data => {
    if(data && data.fans && !data.fans.length) return Promise.reject({err: null, data: []})
    const { fans } = data
    return mongo.connect("user")
    .then(db => db.find({
      _id: { $in: [...fans] }
    }, {
      limit: pageSize,
      skip: pageSize * currPage,
      projection: {
        username: 1,
        avatar: 1
      },
    }))
    .then(data => data.toArray())
  })
  .catch(err => {
    if(isType(err, 'object') && err.data) return err.data
    errMsg = err
    console.log(err)
    return false
  })


  if(errMsg) {
    ctx.status = 500
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