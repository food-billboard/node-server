const Router = require('@koa/router')
const SpecDropList = require('./specDropList')

const router = new Router()

router.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router