const Router = require('@koa/router')
const Browse = require('./browser')
const Store = require('./store')
const { MongoDB, verifyTokenToData, withTry, isType } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  const mongoId = mongo.dealId(_id)
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    _id: mongoId
  }, {
    projection: {
      issue: 1
    }
  }))
  .then(data => {
    if(data && data.issue && !data.issue.length) return Promise.reject({err: null, data: []})
    const { issue } = data
    return mongo.connect("movie")
    .then(db => db.find({
      _id: { $in: [...issue] }
    }, {
      skip: pageSize * currPage,
      limit: pageSize,
      projection: {
        name: 1,
        poster: 1,
        hot: 1
      }
    }))
    .then(data => data.toArray()) 
  })
  .catch(err => {
    if(isType(err, 'object') && err.data) return err.data
    console.log(err)
    return false
  })

  if(!data) {
    console.log(data)
    res = {
      success: false,
      res: null
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
.use('/browser', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router