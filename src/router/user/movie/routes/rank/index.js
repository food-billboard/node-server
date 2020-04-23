const Router = require('@koa/router')
const SpecDropList = require('./specDropList')

const router = new Router()

// params: { currPage: 当前页, pageSize: 数量 }

router
.get('/', async (ctx) => {
  ctx.body = '排行榜详情'
})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router