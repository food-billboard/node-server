const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query

  let resultID = []
  let res
  
  const data = await mongo.connect("rank")
  .then(db => db.find({}, {
    projection: {
      other: 0,
      create_time: 0
    }
  }))
  .then(data => data.toArray())
  .then(data => {
    const length = data.length
    const realLen = Math.min(length, count)
    //随机选取排行榜的类型
    for(let i = 0; i < realLen; i ++) {
      const random = Math.floor(Math.random() * length)
      if(!resultID.includes(data[random])) {
        resultID.push(data[random])
      }else {
        i --
      }
    }
    return Promise.all(resultID.map(result => {
      const { match } = result
      return mongo.connect("movie")
      .then(db => db.find({}, {
        sort: {
          ...match.reduce((acc, m) => {
            acc[m] = -1
            return acc
          }, {})
        },
        limit: 3,
        projection: {
          poster: 1, 
          name: 1
        }
      }))
      .then(data => data.toArray())
    }))
  })
  .then(data => {
    data.forEach((re, index) => {
      resultID[index] = {
        ...resultID[index],
        match: [...re]
      }
    })
    return resultID
  })
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg: '服务器错误'
      }
    }
  }else {
    res = {
      success: true,
      res: {
        data: data
      }
    }
  }

  ctx.body = JSON.stringify(res)
})

module.exports = router