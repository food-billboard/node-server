const Router = require('@koa/router')
const Signout = require('./routes/signout')
const Account = require('./routes/account')

const router = new Router()

router.use('/signout', Signout.routes(), Signout.allowedMethods())
router.use('/account', Account.routes(), Account.allowedMethods())

module.exports = router