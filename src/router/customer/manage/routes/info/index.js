const Router = require('@koa/router')
const Avatar = require('./avatar')
const Name = require('./name')

const router = new Router()

router
.use('/name', Name.routes(), Name.allowedMethods())
.use('/avatar', Avatar.routes(), Avatar.allowedMethods())

module.exports = router