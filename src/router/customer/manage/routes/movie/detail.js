const Router = require('@koa/router')
const { MongoDB, verifyTokenToData, dealErr } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { _id } = ctx.query
  const data = mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile),
    issue: { $in: [mongo.dealId(_id)] }
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    if(!data) return Promise.reject({errMsg: '非本人发布电影无权访问', status: 403})
    return true
  })
  .catch(dealErr(ctx))
  
  if(data && !data.err) {
    return await next()
  }

  ctx.body = JSON.stringify(data.res)
})
.get('/', async(ctx) => {
  const { _id } = ctx.query
  let res
  const data = await mongo.connect("movie")
  .then(db => db.findOne({
    _id: mongo.dealId(_id)
  }, {
    projection: {
      name: 1,
      info: 1,
      rest: 1,
      video: 1,
      images: 1,
      poster: 1,
      author_description: 1,
      author_rate: 1,
    }
  }))
  .then(data => {
    if(!data) return Promise.reject({errMsg: '电影不存在', status: 404})
    const {
      info: {
        name,
        alias,
        description,
        screen_time,
        ...nextInfo  
      },
      rest,
      ...nextData
    } = data
    return {
      ... nextData,
      info: {
        name,
        alias,
        description,
        screen_time,
        ...Object.keys(nextInfo).reduce((acc, n) => {
          acc[n] = {
            [n]: nextInfo[n],
            rest: rest[n] || []
          }
          return acc
        }, {})
      }
    }
    
  })
  .catch(dealErr(ctx))

  if(data && data.err) {
    res = data.res
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