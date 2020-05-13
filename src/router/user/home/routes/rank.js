const Router = require('@koa/router')
const { MongoDB } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router.get('/', async(ctx) => {
  const { count=3 } = ctx.query
  
  const rankList = await mongo.find('_rank_')
  const length = rankList.length
  let resultID = []
  let result = []
  let data
  //随机选取排行榜的类型
  for(let i = 0; i < count; i ++) {
    const random = Math.floor(Math.random() * length)
    if(!resultID.includes(rankList[random])) {
      resultID.push(rankList[random])
    }else {
      i --
    }
  }
  result = await mongo.find('_movie_', {
    query: [
      {
        __type__: 'sort',
        hot: -1,
        total_rate: -1
      }
    ],
    $or: resultID.map(id => ( { "info.classify": { $elemMatch: { $eq: id } } } ) )
  }, { poster: 1, info: 1 })

  data = result.reduce((acc, re) => {
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

  ctx.body = JSON.stringify({
    success: true,
    res: {
      data
    }
  })
})

module.exports = router