const Router = require('@koa/router')

const router = new Router()

// 1. 点击预览后台根据用户ua生成url地址
// 2. 后台将ua写入cookie中
// 2. 前端访问页面，首先调用接口查看是否可访问

router
.post('/', async (ctx) => {

})
.get('/valid', async (ctx) => {
  
})

module.exports = router