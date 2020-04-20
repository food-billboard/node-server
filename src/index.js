const Router = require('@koa/router')
const { User, Customer } = require('./router')

const router = new Router()

router.use('/api/user', User.routes(), User.allowedMethods())
router.use('/api/customer', Customer.routes(), Customer.allowedMethods())

module.exports = router