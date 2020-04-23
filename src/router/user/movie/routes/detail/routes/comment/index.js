const Router = require('@koa/router')
const List = require('./list')
const Detail = require('./detail')

const router = new Router()

// { id: 电影id, count: 数量 }

router
.get('/', async (ctx) => {
  ctx.body = '评论信息'
})
.use('/list', List.routes(), List.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router