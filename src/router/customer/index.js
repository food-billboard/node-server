const Router = require('@koa/router')
const Manage = require('./manage')
const Movie = require('./movie')
const User = require("./user")

const router = new Router()

router
.use('/manage', Manage.routes(), Manage.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use("/user", User.routes(), User.allowedMethods())

module.exports = router