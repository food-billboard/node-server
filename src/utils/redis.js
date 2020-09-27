const { dealErr, responseDataDeal } = require('./error-deal')
const redis = require('ioredis')

const connect = () => {
  const client = redis.createClient({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || 'localhost',
  })
  client.on('connect', function () {
    console.log('redis is connected')
  })

  return client
}

const AccessLimitCheck = async(ctx, next) => {
  let isLimit = await isAcessLimit(ctx)

  if(isLimit) {
    const data = dealErr(ctx)({ errMsg: 'please visit this server later', status: 429 })
    responseDataDeal({
      ctx,
      data,
      needCache: false
    })
    return
  }

  return await next()
}

const isAcessLimit = async (ctx) => {
  const client = connect()
}

module.exports = {
  AccessLimitCheck
}