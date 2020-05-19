const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()
// { currPage: 当前页, pageSize: 数量 }

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      store: 1
    }
  }))
  .then(data => {
    const { store } = data
    return mongo.connect("movie")
    .then(db => db.find({
      _id: { $in: [...store] }
    }, {
      projection: {
        info: 1,
        poster: 1
      },
      limit: pageSize,
      skip: pageSize * currPage,
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
    return false
  })

  if(!data) {
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

module.exports = router