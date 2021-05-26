const Router = require('@koa/router')
const Message = require('./message')
const Room = require('./room')
const Member = require('./member')

const router = new Router()

router
.use('/message', Message.routes(), Message.allowedMethods())
.use('/room', Room.routes(), Room.allowedMethods())
.use('/member', Member.routes(), Member.allowedMethods())

module.exports = router