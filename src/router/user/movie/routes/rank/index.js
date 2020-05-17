const Router = require('@koa/router')
const SpecDropList = require('./specDropList')
const { MongoDB } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { currPage=0, pageSize=30, _id } = ctx.query
  let res
  let result
  const data = await mongo.findOne("rank", { //_rank_
    _id: mongo.dealId(_id)
  }, {
    match: 1
  })
  .then(data => {
    return mongo.find("movie", {//_movie_
      query: [
        {
          __type__: 'sort',
          ...data.match.reduce((acc, da) => {
            acc[da] = -1
            return acc
          }, {})
        },
        ["limit", pageSize]
        ["skip", pageSize * currPage]
      ],
    }, {
      "info.classify": 1,
      poster: 1,
      publish_time: 1,
      hot: 1
    })
  })
  .then(data => {
    result = [...data]
    return Promise.all(data.map(d => {
      const { info: {classify} } = d
      return mongo.find("classify", {//_classify_
        _id: { $in: classify.map(c => mongo.dealId(c)) }
      }, {
        name: 1
      })
    }))
  })
  .then(data => {
    return result.map((r, i)=> {
      const { info } = r
      return {
        ...r,
        info: {
          ...info,
          classify: data[i]
        }
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
      res: {
        errMsg: "服务器错误"
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
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router