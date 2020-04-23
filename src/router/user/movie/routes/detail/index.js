const Router = require('@koa/router')
const Comment = require('./routes/comment')
const Simple = require('./routes/simple')

const router = new Router()

// { id: 电影id }

router
.get('/', async (ctx) => {
  ctx.body('电影详情')
})
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/simple', Simple.routes(), Simple.allowedMethods())

module.exports = router