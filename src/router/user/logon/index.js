const Router = require('@koa/router')
const Signout = require('./routes/signout')
const Account = require('./routes/account')
const Register = require('./routes/register')
const Forget = require('./routes/forget')
const EmailSend = require('./routes/emailsend')

const router = new Router()

router
.use('/signout', Signout.routes(), Signout.allowedMethods())
.use('/account', Account.routes(), Account.allowedMethods())
.use('/register', Register.routes(), Register.allowedMethods())
.use('/forget', Forget.routes(), Forget.allowedMethods())
.use('/email', EmailSend.routes(), EmailSend.allowedMethods())

module.exports = router