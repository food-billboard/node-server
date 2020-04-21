const Router = require('@koa/router') 
const About = require('./routes/about')
const Query = require('./routes/query')


const router = new Router()

router.use('./about', About.routes(), About.allowedMethods())
router.use('./query', Query.routes(), Query.allowedMethods())

module.exports = router