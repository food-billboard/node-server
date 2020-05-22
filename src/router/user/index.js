const Router = require('@koa/router')
const Logon = require('./logon')
const Home = require('./home')
const Movie = require('./movie')
const Setting = require('./setting')
const Customer = require("./customer")

const router = new Router()

router
.use('/logon', Logon.routes(), Logon.allowedMethods())
.use('/home', Home.routes(), Home.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/setting', Setting.routes(), Setting.allowedMethods())
.use('/customer', Customer.routes(), Customer.allowedMethods())

module.exports = router