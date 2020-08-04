const Router = require('@koa/router')
const Manage = require('./manage')
const Movie = require('./movie')
const User = require("./user")
const Upload = require('./upload')
const Barrage = require('./barrage')

const router = new Router()

router
.use('/manage', Manage.routes(), Manage.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use("/user", User.routes(), User.allowedMethods())
.use('/upload', Upload.routes(), Upload.allowedMethods())
.use('/barrage', Barrage.routes(), Barrage.allowedMethods())

module.exports = router