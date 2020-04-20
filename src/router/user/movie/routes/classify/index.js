const Router = require('@koa/router')
const SpecDropList = require('./sepcDropList')

const router = new Router()

router.use('/specDropList', SpecDropList.routes(), SpecDropList.allowedMethods())

module.exports = router