const Router = require('@koa/router')
const Dashboard = require('./dashboard')
const Admin = require('./admin')
const Error = require('./error')
const Movie = require('./movie')
const User = require('./user')
const Instance = require('./instance')
const Media = require('./media')
const { verifyTokenToData, dealErr, responseDataDeal } = require('@src/utils')

const router = new Router()

router
//登录判断
.use(async(ctx, next) => {
  const [ , token ] = verifyTokenToData(ctx)
  let error
  if(!token) {
    error = dealErr(ctx)({ errMsg: 'not authorization', status: 401 })
    responseDataDeal({
      ctx,
      data: error,
      needCache: false
    })
    return
  }

  return await next()

})
.use('/dashboard', Dashboard.routes(), Dashboard.allowedMethods())
.use('/admin', Admin.routes(), Admin.allowedMethods())
// .use('/error', Error.routes(), Error.allowedMethods())
.use('/movie', Movie.routes(), Movie.allowedMethods())
.use('/user', User.routes(), User.allowedMethods())
.use('/instance', Instance.routes(), Instance.allowedMethods())
.use('/media', Media.routes(), Media.allowedMethods())

module.exports = router