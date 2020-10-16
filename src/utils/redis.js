const { dealErr, responseDataDeal } = require('./error-deal')
const Redis = require('ioredis')

let client
const LIMIT_ACCESS_SECONDS = 10
const LIMIT_ACCESS_TIMES = 5

const redisConnect = ({ port=6379, host='localhost', options={
  // password
  // connectTimeout
} }={}) => {

  if(process.env.NODE_ENV !== 'production') {
    console.log("development environment not run the redis default, you can run the command 'npm run prod' to start the redis server")
    return
  }

  const _port = process.env.REDIS_PORT || port
  const _host = process.env.REDIS_HOST || host
  client = new Redis(
    _port,
    _host,
    options
  )

  client.on('connect', function () {
    console.log(`redis is connected and run in host: ${_host} port: ${_port}`)
  })
  client.on('error', function() {
    console.log('redis connect error')
    redisDisConnect()
  })

}

const redisDisConnect = () => {
  if(!client) return false
  client.disconnect()
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

getIp = (ctx) => {
  const { req: { headers, connection, socket } } = ctx
  try {
    return headers['x-forwarded-for'] || headers['X-Forwarded-For'] || connection.remoteAddress || socket.remoteAddress || connection.socket.remoteAddress 
  }catch(err) {
    console.log(err)
  }
  return false
}

const isAcessLimit = async (ctx) => {
  if(!client) return false
  const { request: { method, url } } = ctx
  //客户端ip获取
  const ip = getIp(ctx)
  if(!ip) return false
  try {
    const key = `${ip}-${url}-${method}`.toLowerCase()
    const data = await client.get(key)
    if(!data) {
      await client.setex(key, LIMIT_ACCESS_SECONDS, 1)
      return false
    }else if(data && data < LIMIT_ACCESS_TIMES){
      await client.incr(key)
      return false
    }
  }catch(err) {
    console.log(err)
  }

  return true
}


module.exports = {
  AccessLimitCheck,
  redisConnect,
  redisDisConnect,
  redis: client
}