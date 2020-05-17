const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')
const { MongoDB, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router
.get('/', async(ctx) => {
  const { currPage=0, pageSize=30, _id, sort } = ctx.query
  let res
  let result
  const commonQuery = [ ['limit', pageSize], ['skip', currPage * pageSize]]
  const query = sort ? [
    ...commonQuery,
    { 
      __type__: 'sort',
      ...sort
    }
  ] : [...commonQuery]
  const data = await mongo.find('movie', {//_movie_
    query,
    "info.classify": { $in: [_id] }
  }, {
    poster: 1,
    name: 1,
    "info.classify": 1,
    publish_time: 1,
    hot: 1
  })
  .then(data => {
    result = [...data]
    return Promise.all(data.map(d => {
      const { info: {classify} } = d
      return mongo.find("classify", {
        _id: { $in: classify.map(c => mongo.dealId(c)) }
      }, {
        name: 1,
        _id: 0
      })
    }))
  })
  .then(data => {
    return result.map((r, i) => {
      const { info: {classify, ...nextInfo} } = r
      return {
        ...r,
        info: {
          ...nextInfo,
          classify: data[i]
        }
      }
    })
  })
  .catch(err => {
    console.log(err)
    return false
  })
  if(!result) {
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
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router