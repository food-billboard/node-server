const Router = require('@koa/router')
const Signout = require('./routes/signout')
const Account = require('./routes/account')
const Register = require('./routes/register')

const router = new Router()

router
.use('/signout', Signout.routes(), Signout.allowedMethods())
.use('/account', Account.routes(), Account.allowedMethods())
.use('/register', Register.routes(), Register.allowedMethods())

module.exports = router