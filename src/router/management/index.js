const Router = require('@koa/router')
const Dashboard = require('./dashboard')
const Admin = require('./admin')
const Error = require('./error')
const Movie = require('./movie')
const User = require('./user')
const Instance = require('./instance')
const EatWhat = require('./eat-what')
const Media = require('./media')
const Chat = require('./chat')
const Schedule = require('./schedule')
const Screen = require('./screen')
const Raspberry = require('./raspberry')
const { loginAuthorization } = require('@src/utils')

const router = new Router()

router
//登录判断
.use(loginAuthorization())
.use('/dashboard', Dashboard.routes(), Dashboard.allowedMethods())
.use('/admin', Admin.routes(), Admin.allowedMethods())
// .use('/error', Error.routes(), Error.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/user', User.routes(), User.allowedMethods())
.use('/instance', Instance.routes(), Instance.allowedMethods())
.use('/media', Media.routes(), Media.allowedMethods())
.use('/chat', Chat.routes(), Chat.allowedMethods())
.use('/schedule', Schedule.routes(), Schedule.allowedMethods())
.use('/screen', Screen.routes(), Screen.allowedMethods())
.use('/raspberry', Raspberry.routes(), Raspberry.allowedMethods())
.use('/eat_what', EatWhat.routes(), EatWhat.allowedMethods())

module.exports = router