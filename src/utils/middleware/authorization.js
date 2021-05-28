const { verifyTokenToData } = require('../token')
const { dealErr, responseDataDeal } = require('../error-deal')

function authorizationMiddleware(callback) {
  const realCallback = typeof callback === 'function' ? callback : (data) => data 
  return async function(ctx, next) {
    const [, token] = verifyTokenToData(ctx)
    if(!token) {
      let data = dealErr(ctx)({
        errMsg: 'not authorization',
        status: 401
      })
      data = await realCallback(data) || data 
      responseDataDeal({
        data,
        ctx,
        needCache: false 
      })
      return 
    }
    return await next()
  }
}

module.exports = authorizationMiddleware