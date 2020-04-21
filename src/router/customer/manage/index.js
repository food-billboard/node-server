const Router = require('@koa/router')
const Attention = require('./routes/attention')
const Movie = require('./routes/movie')
const Comment = require('./routes/comment')
const Fans = require('./routes/fans')

const router = new Router()

router.use('/attention', Attention.routes(), Attention.allowedMethods())
router.use('/movie', Movie.routes(), Movie.allowedMethods())
router.use('/comment', Comment.routes(), Comment.allowedMethods())
router.use('/fans', Fans.routes(), Fans.allowedMethods())


module.exports = router