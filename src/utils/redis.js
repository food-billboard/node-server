const Redis = require('ioredis')
const chalk = require('chalk')
const { dealErr, responseDataDeal } = require('./error-deal')
const { connectTry } = require('./tool')


let client
const LIMIT_ACCESS_SECONDS = 10
const LIMIT_ACCESS_TIMES = 20

const redisConnect = async ({ port=6379, host='127.0.0.1', options={
  // password
  // connectTimeout
} }={}) => {

  return new Promise((resolve, reject) => {

    const _port = process.env.REDIS_PORT || port
    const _host = process.env.REDIS_HOST || host
    client = new Redis(
      _port,
      _host,
      options
    )

    client.on('connect', function () {
      console.log(chalk.bgBlue(`redis is connected and run in host: ${_host} port: ${_port}`))
      resolve()
    })

    client.on('error', function(e) {
      console.log(chalk.bgRed('redis connect error: ' + JSON.stringify(e)))
      reject('redis connect error')
      redisDisConnect()
    })

  })

}

const redisDisConnect = () => {
  if(!client) return false
  client.disconnect()
}

const AccessLimitCheck = async(ctx, next) => {
  let isLimit = await isAcessLimit(ctx)

  return await next()

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
  if(!client || process.env.NODE_ENV !== 'production') return false
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

const dealRedis = async (opera) => {
  return await opera(client)
}


module.exports = {
  AccessLimitCheck,
  redisConnect: connectTry(redisConnect),
  redisDisConnect,
  dealRedis
}