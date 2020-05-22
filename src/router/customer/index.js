const Router = require('@koa/router')
const Message = require('./message')
const Manage = require('./manage')
const Movie = require('./movie')
const User = require("./user")

const router = new Router()

router
.use('/message', Message.routes(), Message.allowedMethods())
.use('/manage', Manage.routes(), Manage.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use("/user", User.routes(), User.allowedMethods())

module.exports = router