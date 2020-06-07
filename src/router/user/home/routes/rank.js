const Router = require('@koa/router')
const { RankModel, dealErr } = require('@src/utils')

const router = new Router()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query

  let res
  const data = await RankModel.find({})
  .select({
    other: 0,
    createdAt: 0,
    updatedAt: 0
  })
  .sort({
    glance: -1
  })
  .limit(12)
  .populate({
    path: 'match',
    select: {
      poster: 1, 
      name: 1
    },
    options: {
      limit: count
    }
  })
  .exec()
  .then(data => data)
  .catch(dealErr(ctx))

  // const data = await mongo.connect("rank")
  // .then(db => db.find({}, {
  //   projection: {
  //     other: 0,
  //     create_time: 0
  //   }
  // }))
  // .then(data => data.toArray())
  // .then(data => {
  //   const length = data.length
  //   const realLen = Math.min(length, count)
  //   //随机选取排行榜的类型
  //   for(let i = 0; i < realLen; i ++) {
  //     const random = Math.floor(Math.random() * length)
  //     if(!resultID.includes(data[random])) {
  //       resultID.push(data[random])
  //     }else {
  //       i --
  //     }
  //   }
  //   return Promise.all(resultID.map(result => {
  //     const { match } = result
  //     return mongo.connect("movie")
  //     .then(db => db.find({}, {
  //       sort: {
  //         ...match.reduce((acc, m) => {
  //           acc[m] = -1
  //           return acc
  //         }, {})
  //       },
  //       limit: 3,
  //       projection: {
  //         poster: 1, 
  //         name: 1
  //       }
  //     }))
  //     .then(data => data.toArray())
  //   }))
  // })
  // .then(data => {
  //   data.forEach((re, index) => {
  //     resultID[index] = {
  //       ...resultID[index],
  //       match: [...re]
  //     }
  //   })
  //   return resultID
  // })
  // .catch(err => {
  //   console.log(err)
  //   return false
  // })

  if(data && data.err) {
    res = {
      ...data.res
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