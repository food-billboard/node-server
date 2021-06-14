const Router = require('@koa/router')
const Room = require('./room')
const Message = require('./message')
const Members = require('./members')

const router = new Router()

router
.use('/room', Room.routes(), Room.allowedMethods())
.use('/message', Message.routes(), Message.allowedMethods())
.use('/member', Members.routes(), Members.allowedMethods())

module.exports = router