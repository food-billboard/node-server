const Router = require('@koa/router')
const Comment = require('./comment')
const Feedback = require('./feedback')
const Header = require('./header')
const Issue = require('./issue')
const Rate = require('./rate')

const router = new Router()

router
.use('/comment', Comment.routes(), Comment.allowedMethods())
.use('/feedback', Feedback.routes(), Feedback.allowedMethods())
.use('/info', Header.routes(), Header.allowedMethods())
.use('/issue', Issue.routes(), Issue.allowedMethods())
.use('/rate', Rate.routes(), Rate.allowedMethods())

module.exports = router