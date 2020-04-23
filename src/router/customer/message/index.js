const Router = require('@koa/router')
const Detail = require('./routes/detail')

const router = new Router()

// get 
// putparams: { id: 消息id }
// postdata: { 
//   content: 消息内容,
//   type: 消息类型(image | audio | text | video),
//   time: 时间,
//   username: 用户名,
//   id: 用户id,
//   image: 用户头像,
//   news: 消息id,
//   mineId: 个人id
// }
// deleteparams: { id: 消息id }

router
.get('/', async (ctx) => {
  ctx.body = '获取消息'
})
.put('/', async (ctx) => {
  ctx.body = '读取消息'
})
.delete('/', async (ctx) => {
  ctx.body = '删除消息'
})
.post('/', async (ctx) => {
  ctx.body = '发送消息'
})
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router