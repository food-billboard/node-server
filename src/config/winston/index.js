const winston = require('winston')
const { createLogger, transports, format, config } = winston
const { path: root } = require('app-root-path')
const async_hooks = require('async_hooks')
const { createHook, executionAsyncId, executionAsyncResource } = async_hooks
const path = require('path')
const { timestamp, label, combine, simple, splat, prettyPrint, printf, json, ms } = format
const Day = require('dayjs')
const chalk = require('chalk')
const fs = require('fs')
const { verifyTokenToData } = require('@src/utils/token')
const { isType, uuid } = require('@src/utils/tool')

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

const commonTransports = (fileconfig={}, consoleconfig={}) => {
  return process.env.NODE_ENV === 'production' ?
  new transports.File({
    ...options.file,
    level: 'error',
    ...fileconfig
  })
  :
  new transports.Console({
    ...options.console,
    level: 'error',
    ...consoleconfig
  })
}

//异常处理
winston.exceptions.handle(
  commonTransports({
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
    commonTransports({
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
    commonTransports({
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
    commonTransports({
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
      level: 'info',
      filename: path.resolve(root, 'src/logs/exception/logs.log')
    })
  ]
})

//处理未处理的promise reject
request.rejections.handle(
  commonTransports({ filename: path.resolve(root, 'src/logs/promise/logs.log') })
)

response.rejections.handle(
  commonTransports({ filename: path.resolve(root, 'src/logs/promise/logs.log') })
)

exception.rejections.handle(
  commonTransports({ filename: path.resolve(root, 'src/logs/promise/logs.log') })
)

database.rejections.handle(
  commonTransports({ filename: path.resolve(root, 'src/logs/promise/logs.log') })
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

//只对生产环境进行文件日志写入
request.stream = {
  write: function(message, encoding) {
    if(process.env.NODE_ENV === 'production') {
      request.info(message)
    }else {
      // console.info(message)
    }
  }
}

//错误日志
const log4Error = (ctx, error) => {
  const { __request_log_id__ } = ctx
  if(process.env.NODE_ENV !== 'production' || !__request_log_id__) {
    console.log(chalk.red('error', error))
    return
  }

  let writeError

  if(typeof error === 'string') {
    writeError = {
      errMsg: error,
      timestamp: new Date(),
      uuid: __request_log_id__
    }
  }else if(isType(error, 'object')) {
    writeError = {
      ...writeError,
      uuid: __request_log_id__
    }
  }else {
    console.log(chalk.red('error', error))
    return
  }

  database.info(Json.stringify(writeError))
}

const log4RequestAndResponse = (ctx, response) => {

}

//数据库日志
const log4Database = (error, doc, next) => {

  //仅生产环境
  if(process.env.NODE_ENV === 'production') {

      const { name, collectionName, schema, query, childSchemas, op, options, _fields, subpaths } = this

      database.info(JSON.stringify({
        name, 
        collectionName, 
        schema, 
        query, 
        childSchemas, 
        op, 
        options, 
        _fields, 
        subpaths,
        '$id': this['$id'],
        response: doc,
        error
      }))

  }else if(error){
    // console.log(error)
  }

  next && next()

}

const middleware4Uuid = async (ctx, next) => {

  if(process.env.NODE_ENV !== 'production') return await next()

  const [, token] = verifyTokenToData(ctx)

  let id = uuid()

  if(token) {
    const { mobile } = token
    id = mobile.toString()
  }

  ctx.request.__request_log_id__ = id

  return await next()
}

//全链路日志记录


module.exports = {
  request,
  response,
  exception,
  database,
  log4Error,
  log4Database,
  log4RequestAndResponse,
  middleware,
  beforeQueryDatabase,
  afterResponse4Log,
  afterResponse4Exception,
  middleware4Uuid
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


// const asyncHooks = createHook({
//   init: (asyncId, type, triggerAsyncId, resource) => {
//     // fs.writeSync(1, type)
//   },
//   before: (asyncId) => {

//   },
//   after: (asyncId) => {
//     fs.writeSync(1, asyncId)
//   },
//   destroy: (asyncId) => {

//   }
// })
// //开启promise asyncId分配
// .enable()
// //关闭asyncId分配
// //.disabled()