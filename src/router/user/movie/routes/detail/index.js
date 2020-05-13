const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')
const { MongoDB, withTry } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

router
.get('/', async (ctx) => {
  const { _id } = ctx.query
  let res
  const [, result] = await withTry(mongo.find)('_movie_', {
    _id: mongo.dealId(_id)
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
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/simple', Simple.routes(), Simple.allowedMethods())

module.exports = router