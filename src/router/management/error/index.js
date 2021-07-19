const Router = require('@koa/router')
const Get = require('./utils/get')
const Post = require('./utils/post')
const Put = require('./utils/put')
const Delete = require('./utils/delete')

const router = new Router()

router
// .get('/', Get)
// .delete('/', Delete)
// .post('/', Post)
// .put('/', Put)

module.exports = router