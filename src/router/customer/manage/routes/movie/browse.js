const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { currPage: 当前页, pageSize: 数量 }

router.get('/', async (ctx) => {
  const { currPage=0, pageSize=30 } = ctx.query
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const data = await mongo.findOne("_user_", {
    mobile,
    query: [ [ "limit", pageSize ], [ "skip", pageSize * currPage ] ]
  }, {
    glance: 1
  })
  //查找电影详情
  .then(data => {
    const { glance } = data
    return mongo.find("_movie_", {
      _id: { $in: [...glance] }
    }, {
      info: 1,
      poster: 1
    })
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