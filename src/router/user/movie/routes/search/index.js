const Router = require('@koa/router')
const {   
  About,
  Query
} = require('./routes')

const router = new Router()

router.use('./about', About.routes(), About.allowedMethods())
router.use('./query', Query.routes(), Query.allowedMethods())

module.exports = router