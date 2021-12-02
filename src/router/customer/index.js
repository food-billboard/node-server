const Router = require('@koa/router')
const Manage = require('./manage')
const Movie = require('./movie')
const User = require("./user")
const Upload = require('./upload')
const Barrage = require('./barrage')
const { verifyTokenToData, dealErr, responseDataDeal } = require("@src/utils")

const router = new Router()

router
.use(async(ctx, next) => {
  const [, token] = verifyTokenToData(ctx)
  const { url } = ctx.request 
  if(url.startsWith("/api/customer/user")) return await next()
  if(!token) {
    const data = dealErr(ctx)({ errMsg: 'not authorization', status: 401 })
    responseDataDeal({
      ctx,
      data,
      needCache: false
    })
    return 
  }
  return await next()
})
.use('/manage', Manage.routes(), Manage.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use("/user", User.routes(), User.allowedMethods())
.use('/upload', Upload.routes(), Upload.allowedMethods())
.use('/barrage', Barrage.routes(), Barrage.allowedMethods())

module.exports = router