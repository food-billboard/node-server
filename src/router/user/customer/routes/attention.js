const Router = require('@koa/router')
const { MongoDB } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  let errMsg
  let mongoId = mongo.dealId(_id)
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    _id: mongoId
  }, {
    projection: {
      attentions: 1
    },
    limit: pageSize,
    skip: pageSize * currPage
  }))
  .then(data => {
    const { attentions } = data
    return mongo.connect("user")
    .then(db => db.find({
      _id: { $in: [...attentions.map(a => typeof a == 'object' ? a : mongo.dealId(a))] }
    }, {
      projection: {
        username: 1,
        avatar: 1
      }
    }))
    .then(data => data.toArray())
  })
  .catch(err => {
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