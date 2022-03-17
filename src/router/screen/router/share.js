const Router = require('@koa/router')

const router = new Router()

// 1. 设置分享，并设置参数，后台生成url地址
// 2. 前端访问页面，调用接口获取url地址信息
// 3. 后端判断url是否过期，过期则返回错误的信息
// 4. 前端获取url分享的配置，如果存在密码则输入密码并调佣接口判断
// 5. 前端定时请求接口验证其时效性

router
// 验证url地址是否过期
.get('/', async (ctx) => {

})
// 分享
.post('/', async (ctx) => {

})
// 验证
.post('/valid', async (ctx) => {

})
// 取消分享
.delete('/', async (ctx) => {

})

module.exports = router