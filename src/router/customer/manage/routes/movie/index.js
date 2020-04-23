const Router = require('@koa/router')
const Browse = require('./browse')
const Store = require('./store')

const router = new Router()

// 发布电影data: { 
//   user: 用户id
//   video: {
//     src: 视频地址
//     poster: 海报地址
//   } 
//   info: {
//     name: 电影名称
//     area: 地区
//     director: 导演
//     actor: 演员
//     type: 类型
//     time: 时间
//     description: 描述
//     language: 语言
//   }
//   image: {
//     image: 截图地址,
//     id: id
//   }
// }
// 修改电影data: { 
//   user: 用户id
//   id: 电影id
//   video: {
//     src: 视频地址
//     poster: 海报地址
//     id: 视频id
//   } 
//   info: {
//     name: 电影名称
//     area: 地区
//     director: 导演
//     actor: 演员
//     type: 类型
//     time: 时间
//     description: 描述
//     language: 语言
//   }
//   image: {
//     image: 截图地址,
//     id: id
//   }
// }
// 获取params: { currPage: 当前页, pageSize: 数量, id: 用户id }


router
.put('/', async (ctx) => {
  ctx.body = '发布电影'
})
.post('/', async (ctx) => {
  ctx.body = '修改电影'
})
.get('/', async (ctx) => {
  ctx.body = '获取电影发布'
})
.use('/browse', Browse.routes(), Browse.allowedMethods())
.use('/store', Store.routes(), Store.allowedMethods())

module.exports = router