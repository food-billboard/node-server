const Router = require('@koa/router')
const { MongoDB, isType } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let errMsg
  const mongoId = mongo.dealId(_id)
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    _id: mongoId
  }, {
    projection: {
      glance: 1
    }
  }))
  //查找电影详情
  .then(data => {
    if(data && data.glance && !data.glance.length) return Promise.reject({err: null, data: []})
    const { glance } = data
    return mongo.connect("movie")
    .then(db => db.find({
      _id: { $in: [...glance] }
    }, {
      limit: pageSize,
      skip: pageSize * currPage,
      projection: {
        "info.description": 1,
        "info.name": 1,
        poster: 1
      }
    }))
  })
  .then(data => data.toArray())
  .then(data => {
    return data.map(d => {
      const { info: { description, name }, ...nextD} = d
      return {
        ...nextD,
        description,
        name,
      }
    })
  })
  .catch(err => {
    if(isType(err, "object") && err.data) return err.data
    console.log(err)
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