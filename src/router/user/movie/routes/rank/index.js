const Router = require('@koa/router')
const SpecDropList = require('./specDropList')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { currPage, pageSize, _id } = ctx.query
  let res
  const [ , result] = await withTry(mongo.find)("_movie_", {
    query: [
      {
        __type__: 'sort',
        total_rate: -1,
        hot: -1
      },
      ["limit", pageSize]
      ["skip", pageSize * currPage]
    ],
    _id: mongo.dealId(_id)
  }, {
    info: 1,
    poster: 1,
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
})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router