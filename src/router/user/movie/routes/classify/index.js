const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')

const router = new Router()

// params: { currPage: 当前页, pageSize: 数量 }

router
.get('/', async(ctx) => {
  ctx.body = '分类列表'
})
.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router