const Router = require('@koa/router')
const Like = require('./like')

const router = new Router()

// data: { id: 个人id, content: 内容, comment: 回复用户时存在该评论的id  }

router
.post('/', async (ctx) => {
  ctx.body = '评论'
})
.use('/like', Like.routes(), Like.allowedMethods())

module.exports = router