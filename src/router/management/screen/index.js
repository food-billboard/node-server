const Router = require('@koa/router')
const List = require('./list')
const Mock = require('./mock')
const Model = require('./model')

const router = new Router()

router
.use('/list', List.routes(), List.allowedMethods())
.use('/mock', Mock.routes(), Mock.allowedMethods())
.use('/model', Model.routes(), Model.allowedMethods())

module.exports = router