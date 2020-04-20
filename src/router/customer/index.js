const Router = require('@koa/router')
const Message = require('./message')
const Manage = require('./manage')
const Movie = require('./movie')

const router = new Router()

router.use('/message', Message.routes(), Message.allowedMethods())
router.use('/manage', Manage.routes(), Manage.allowedMethods())
router.use('/movie', Movie.routes(), Movie,this.allowedMethods())

module.exports = router