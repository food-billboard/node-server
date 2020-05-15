const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')
const { MongoDB, withTry } = require('@src/utils')

const router = new Router()
const mongo = MongoDB()

router
.get('/', async(ctx) => {
  const { currPage, pageSize, _id, sort } = ctx.query
  let res
  const commonQuery = [ ['limit', pageSize], ['skip', currPage * pageSize]]
  const query = sort ? [
    ...commonQuery,
    { 
      __type__: 'sort',
      ...sort
    }
  ] : [...commonQuery]
  const [, result] = await withTry(mongo.find)('_movie_', {
    query,
    "info.classify": { $in: [mongo.dealId(_id)] }
  }, {
    poster: 1,
    info: 1,
    publish_time: 1,
    hot: 1
  })
  if(!result) {
    res = {
      success: false,
      res: null
    }
  }else {
    res = {
      success: true,
      res: {
        data: result
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router