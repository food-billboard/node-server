const Router = require('@koa/router')
const User = require('./user')
const Customer = require('./customer')
const ObjectID = require('mongodb').ObjectID

const router = new Router()

router
.use(async(ctx, next) => {
  const { body: { _id:dataId } } = ctx.request
  const { _id:queryId } = ctx.query
  let res = {
    success: false,
    res: null
  }

  const isValidData = ObjectID.isValid(dataId)
  const isValidQuery = ObjectID.isValid(queryId)

  if(dataId || queryId) {
    if(dataId && queryId) {
      if(isValidData && isValidQuery) {
        return await next()
      }else {
        ctx.status = 400
      }
    }else if(dataId && !queryId) {
      if(isValidData) {
        return await next()
      }else {
        ctx.status = 400
      }
    }else {
      if(isValidQuery) {
        return await next()
      }else {
        ctx.status = 400
      }
    }
  }else {
    return await next()
  }
  ctx.body = JSON.stringify(res)
})
.use('/user', User.routes(), User.allowedMethods())
.use('/customer', Customer.routes(), Customer.allowedMethods())

module.exports = router