const Router = require('@koa/router')
const Actor = require('./actor')
const Area = require('./area')
const Director = require('./dirrector')
const Lang = require('./lang')
const Sort = require('./sort')

const router = new Router()

router
.use('/actor', Actor.routes(), Actor.allowedMethods())
.use('/area', Area.routes(), Area.allowedMethods())
.use('/director', Director.routes(), Director.allowedMethods())
.use('/lang', Lang.routes(), Lang.allowedMethods())
.use('/sort', Sort.routes(), Sort.allowedMethods())

module.exports = router