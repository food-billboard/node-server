const Router = require('@koa/router')
const Actor = require('./actor')
const Area = require('./area')
const Director = require('./dirrector')
const Lang = require('./lang')
const Sort = require('./sort')

const router = new Router()

router.use('/actor', Actor.routes(), Actor.allowedMethods())
router.use('/area', Area.routes(), Area.allowedMethods())
router.use('/director', Director.routes(), Director.allowedMethods())
router.use('/lang', Lang.routes(), Lang.allowedMethods())
router.use('/sort', Sort.routes(), Sort.allowedMethods())

module.exports = router