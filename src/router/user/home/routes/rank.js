const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query

  let resultID = []
  let res
  
  const data = await mongo.find('_rank_', {}, {other: 0, create_time: 0}).then(data => {
    const length = data.length
    //随机选取排行榜的类型
    for(let i = 0; i < count; i ++) {
      const random = Math.floor(Math.random() * length)
      if(!resultID.includes(data[random])) {
        resultID.push(data[random])
      }else {
        i --
      }
    }

    return mongo.find('_movie_', {
      query: [
        {
          __type__: 'sort',
          hot: -1,
          total_rate: -1
        }
      ],
      "info.classify": { $in: [...resultID] }
    }, { poster: 1, info: 1 })

  })
  .then(data => {
    return data.reduce((acc, re) => {
      const { info: { classify }, ...nextData } = re
      resultID.forEach(r => {
        if(classify.includes(r)) {
          if(!acc[r] || acc[r].length < count) {
            if(!acc[r]) acc[r] = []
            const len = acc[r].length
            acc[r].push({
              ...nextData,
              top: len
            })
          }
        }
      })
      return acc
    }, {})
  })
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) {
    ctx.status = 500
    res = {
      success: false,
      res: null
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