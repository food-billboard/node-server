const Router = require('@koa/router')
const Comment = require('./comment')
const Header = require('./header')
const User = require('./user')

const router = new Router()

router
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/info', Header.routes(), Header.allowedMethods())
.use('/user', User.routes(), User.allowedMethods())

module.exports = router