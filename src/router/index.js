const Router = require('@koa/router')
const User = require('./user')
const Customer = require('./customer')
const Management = require('./management')
const Manage = require('./manage')
const { Types: { ObjectId } } = require('mongoose')
const { dealErr, responseDataDeal } = require('@src/utils')

const router = new Router()

router
.use(async(ctx, next) => {

  const { body: { _id:dataId }={} } = ctx.request
  const { _id:queryId } = ctx.query
  let valid = true

  const isValidData = (dataId || '').split(',').every(item => ObjectId.isValid(item.trim()))
  const isValidQuery = (queryId || '').split(',').every(item => ObjectId.isValid(item.trim()))

  if(dataId || queryId) {
    if(dataId && queryId) {
      if(!isValidData || !isValidQuery) valid = false
    }else if(dataId && !queryId) {
      if(!isValidData) valid = false
    }else {
      if(!isValidQuery) valid = false
    }
  }

  if(valid) return await next()
  
  const data = dealErr(ctx)({ errMsg: 'bad request', status: 400 })
  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})
.use('/user', User.routes(), User.allowedMethods())
.use('/customer', Customer.routes(), Customer.allowedMethods())
.use('/manage', Management.routes(), Management.allowedMethods())
.use('/backend', Manage.routes(), Manage.allowedMethods())

module.exports = router