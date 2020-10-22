const Router = require('@koa/router')
const Search = require('./search')
const Manage = require('./manage')
const Detail = require('./detail')

const router = new Router()

router
.use('/search', Search.routes(), Search.allowedMethods())
.use('/manage', Manage.routes(), Manage.allowedMethods())
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router