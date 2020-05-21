const Router = require('@koa/router')
const { MongoDB, verifyTokenToData, isType } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
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
        info: 1,
        poster: 1
      }
    }))
    .then(data => data.toArray())
  })
  .then(data => {
    return data.map(d => {
      const { info: { description, name }, poster } = d
      return {
        description,
        name,
        poster
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