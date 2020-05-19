const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { currPage: 当前页, pageSize: 数量 }

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findone({
    mobile
  }, {
    limit: pageSize,
    skip: pageSize * currPage,
    projection: {
      glance: 1
    }
  }))
  //查找电影详情
  .then(data => {
    const { glance } = data
    return mongo.connect("movie")
    .then(db => db.find({
      _id: { $in: [...glance] }
    }, {
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