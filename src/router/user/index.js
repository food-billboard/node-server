const Router = require('@koa/router')
const Logon = require('./logon')
const Home = require('./home')
const Movie = require('./movie')
const Setting = require('./setting')

const router = new Router()

router.use('/logon', Logon.routes(), Logon.allowedMethods())
router.use('/home', Home.routes(), Home.allowedMethods())
router.use('/movie', Movie.routes(), Movie.allowedMethods())
router.use('/setting', Setting.routes(), Setting.allowedMethods())

module.exports = router