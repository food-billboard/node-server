const Router = require('@koa/router')
const User = require('./user')
const Customer = require('./customer')

const router = new Router()

router.use('/user', User.routes(), User.allowedMethods())
router.use('/customer', Customer.routes(), Customer.allowedMethods())

module.exports = router