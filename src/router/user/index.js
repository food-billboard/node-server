const Router = require('@koa/router')
const Logon = require('./logon')
const Home = require('./home')
const Movie = require('./movie')
const Setting = require('./setting')
const Customer = require("./customer")
const Barrage = require('./barrage')

const router = new Router()

router
.use('/logon', Logon.routes(), Logon.allowedMethods())
.use('/home', Home.routes(), Home.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/setting', Setting.routes(), Setting.allowedMethods())
.use('/customer', Customer.routes(), Customer.allowedMethods())
.use('/barrage', Barrage.routes(), Barrage.allowedMethods())

module.exports = router