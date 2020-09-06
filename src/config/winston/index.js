const winston = require('winston')
const { createLogger, transports, format, config } = winston
const { path: root } = require('app-root-path')
const path = require('path')
const { timestamp, label, combine, simple, splat, prettyPrint, printf, json, ms } = format
const Day = require('dayjs')

// error: 0, 
// warn: 1, 
// info: 2, 
// http: 3,
// verbose: 4, 
// debug: 5, 
// silly: 6 

const options = {
  file: {
    handleException: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 10,
    colorize: false,
  },
  console: {
    handleException: true,
    json: false,
    colorize: true
  }
}

//异常处理
winston.exceptions.handle(
  new winston.transports.File({
    ...options.file,
    level: 'error',
    filename: path.resolve(root, 'src/logs/exception/logs.log')
  })
)

//请求日志
const request = createLogger({
  level: 'info',
  levels: config.syslog.levels,
  handleExceptions: false,
  //格式化
  format: combine(
    //json
    json(),
    //筛选
    // format((info, opts) => {
    //   console.log(info, opts)
    //   return info
    // })(),
    timestamp(),
    label(),
    ms()
  ),
  exitOnError: false,
  silent: false,
  transports: [
    new transports.File({
      ...options.file,
      level: 'info',
      filename: path.resolve(root, 'src/logs/request/logs.log')
    })
  ]
})

//响应日志
const response = createLogger({
  level: 'info',
  levels: config.syslog.levels,
  handleExceptions: false,
  format: combine(
    json(),
    timestamp(),
    label(),
    ms()
  ),
  exitOnError: false,
  silent: false,
  transports: [
    new transports.File({
      ...options.file,
      level: 'info',
      filename: path.resolve(root, 'src/logs/response/logs.log')
    })
  ]
})

//异常日志
const exception = createLogger({
  level: 'error',
  levels: config.syslog.levels,
  handleExceptions: true,
  format: combine(
    json(),
    timestamp(),
    label(),
    ms()
  ),
  exitOnError: false,
  silent: false,
  transports: [
    new transports.Console({
      ...options.console
    }),
    new transports.File({
      ...options.file,
      level: 'error',
      filename: path.resolve(root, 'src/logs/exception/logs.log')
    })
  ]
})

//数据库日志
const database = createLogger({
  level: 'info',
  levels: config.syslog.levels,
  handleExceptions: true,
  format: combine(
    json(),
    timestamp(),
    label(),
    ms()
  ),
  exitOnError: false,
  silent: false,
  transports: [
    new transports.Console({
      ...options.console
    }),
    new transports.File({
      ...options.file,
      level: 'error',
      filename: path.resolve(root, 'src/logs/exception/logs.log')
    })
  ]
})

//处理未处理的promise reject
request.rejections.handle(
  new transports.File({
    ...options.file,
    level: 'error',
    filename: path.resolve(root, 'src/logs/promise/logs.log')
  })
)

response.rejections.handle(
  new transports.File({
    ...options.file,
    level: 'error',
    filename: path.resolve(root, 'src/logs/promise/logs.log')
  })
)

exception.rejections.handle(
  new transports.File({
    ...options.file,
    level: 'error',
    filename: path.resolve(root, 'src/logs/promise/logs.log')
  })
)

database.rejections.handle(
  new transports.File({
    ...options.file,
    level: 'error',
    filename: path.resolve(root, 'src/logs/promise/logs.log')
  })
)


//预处理http访问信息
const middleware = async (ctx, next) => {
  const { request:_request } = ctx
  const {
    body,
    files,
    header,
    method,
    href,
    querystring,
    host,
    hostname,
    query,
    ip,
  } = _request
  //设置请求标记
  const requestId = ctx.header['x-request-id'] || Day(new Date()).format('YYYYMMDDhhmmss')
  ctx.set({
    requestId
  })
  request.info({
    requestId,
    header,
    method,
    href,
    querystring,
    host,
    hostname,
    query: query || {},
    ip,
    body: body || {},
    files: files || {}
  })
  return await next()
}

//请求完成响应前处理
const afterResponse4Log = (ctx) => {
  const { response:_response } = ctx
  const {
    header,
    status,
    message
  } = _response
  const requestId = ctx.header['x-request-id'] || Day(new Date()).format('YYYYMMDDhhmmss')
  return function(data) {
    response.info({
      requestId,
      header,
      status,
      message,
      body: data
    })
    return data
  }
}

//数据库查询前查询参数处理
/**
 * {
 *  name: {
 *    query: {
 *      
 *    },
 *    operation: {
 * 
 *    }
 *  }
 * }
 */
const beforeQueryDatabase = (ctx) => {
  return function(query={}) {
    const requestId = ctx.header['x-request-id'] || Day(new Date()).format('YYYYMMDDhhmmss')
    database.info({
      ...query,
      requestId
    })
    return query
  }
}

const afterResponse4Exception = (error) => {
  const {
    message,
    name,
    fileName,
    lineNumber,
    columnNumber,
    stack
  } = error
  exception.error({
    message,
    name,
    fileName,
    lineNumber,
    columnNumber,
    stack
  })
  return error
}

module.exports = {
  request,
  response,
  exception,
  database,
  middleware,
  beforeQueryDatabase,
  afterResponse4Log,
  afterResponse4Exception
}


//添加命令行工具用于对相关日志的查询

// 本次请求报文
// 本次请求涉及到的数据库操作
// 本次请求涉及到的缓存操作
// 本次请求涉及到的服务请求
// 本次请求所遭遇的异常
// 本次请求执行的关键函数
// 本次请求所对应的响应体

// requestId sessionId transactionId
// X-Request-Id (X-Session-Id) 