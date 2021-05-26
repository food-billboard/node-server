const { isType, formatMediaUrl } = require('./tool')
const { encoded } = require('./token')
const { log4Error, log4RequestAndResponse } = require('@src/config/winston')
const { Types: { ObjectId } } = require('mongoose')

//错误处理
const dealErr = (ctx) => {
  return (err) => {
    let res = {}
    if(err && err.errMsg) {
      const { status=500, ...nextErr } = err
      ctx.status = status
      res = {
        ...nextErr
      }
    }else {
      ctx.status = 500
      res = {
        errMsg: err
      }
    }

    //日志写入
    log4Error(ctx, err)

    return {
      err: true,
      res
    }
  }
}

const parseData = (data) => {
  function parse(data) {
    return (typeof data.toObject === 'function' ? data.toObject() : JSON.parse(JSON.stringify(data)))
  }
  try {
    return !!data && (Array.isArray(data) ? data.map(parse) : parse(data))
  }catch(err) {
    return false 
  }
}

const notFound = (data) => {
  const response = parseData(data)
  if(!response) return Promise.reject({ errMsg: 'not Found', status: 404 })
  return response
}

const withTry = (callback) => {
  return async (...args) => {
    try {
      const data = await callback(...args)
      return [null, data]
    }catch(err) {
      return [err, null]
    }
  }
}

// //强缓存
// Cache-Control max-age no-cache public private no-cache no-store must-revalidate
// Pragma no-cache
// Expires Http日期

// //协商缓存
// Etag/If-None-Match
// Last-Modified/If-Modified-Since

//缓存处理
const judgeCache = (ctx, modifiedTime, etagValidate) => {
  const { request: { headers, method }, query } = ctx
  //只对get进行缓存
  if( 'get' != method.toLowerCase()) return false
  const modified = headers['if-modified-since'] || headers['If-Modified-Since']
  const etag = headers['if-none-match'] || headers['If-None-Match']

  //设置last-modified
  !!modified && ctx.set('last-modified', modifiedTime.toString() )

  let queryEmpty = false

  //空查询参数处理
  if(Object.keys(query).length == 0) {
    ctx.set({ 'ETag': '' })
    queryEmpty = true
  }

  return ( queryEmpty ? ( !etag ) : (typeof etagValidate == 'function' ? etagValidate(ctx, !!etag ? etag : '') : true )) && !!modified && new Date(modified).toString() == new Date(modifiedTime).toString()

  // return !!modified && Day(modified).valueOf() === Day(modifiedTime).valueOf() && ( !!etag && typeof etagValidate == 'function' ? etagValidate(ctx, etag) : true )
}

//将请求参数加密成etag用于缓存处理
const _etagValidate = (ctx, etag) => {
  const { request: { query } } = ctx

  let isSameEtag = true
  if(typeof etag !== 'string') isSameEtag = false
  
  //以,分割的加密查询参数
  const queryArray = etag.split(',')
  let keys = Object.keys(query)

  if(keys.length != queryArray.length) isSameEtag = false

  //判断是否所有查询参数与之前相同
  const newEtag = keys.reduce((acc, cur) => {
    let str = `${cur}=${query[cur]}`
    const encode = encoded(str)
    acc += `,${encode}`
    if(isSameEtag) isSameEtag = !!~queryArray.indexOf(encode)
    return acc
  }, '').slice(1)

  if(newEtag.length > 1) ctx.set({ etag: newEtag })

  return isSameEtag

}

// function stopNext(key) {
//   return key != "connections" && key != "base" && key != '$__'/**阻止继续向内部访问mongoose对象 */
// }

//去除updatedAt
const filterField = (data, field='updatedAt', compare=null) => {

  let origin
  function filter(data) {
    if(Array.isArray(data)) {
      data.forEach(item => {
        filter(item)
      })
    }else if(isType(data, 'object')) {
      Object.keys(data).forEach(key => {
        if(Array.isArray(data[key]) || (isType(data[key], 'object') && !ObjectId.isValid(data[key]) )) {
          filter(data[key])
        }else if(key === field){
          const target = data[key]
          if(typeof origin === 'undefined') origin = target
          if(typeof target !== 'undefined' && (!!compare ? compare(origin, target) : target > origin)) origin = target
        }
      })
    }
  }

  filter(data)

  return origin

}

//静态资源路径处理
const mediaDeal = (data) => {
  if(Array.isArray(data)) {
    return data.map(mediaDeal)
  }else if(isType(data, 'object') && !ObjectId.isValid(data)) {
    return Object.entries(data).reduce((acc, cur) => {
      const [ key, value ] = cur
      acc[key] = mediaDeal(value)
      return acc 
    }, {})
  }else if(typeof data === 'string' && /^\/static\/(image|video|other)\/.+/.test(data)) {
    return formatMediaUrl(data)
  }
  return data 
}

//响应数据处理
const responseDataDeal = ({
  ctx,
  data={},
  //是否需要缓存
  needCache=true,
  //额外的响应处理
  anotherResponse,
  //数据响应前的最后处理
  afterDeal,
  //etag 或用于普通参数请求，或用于静态资源请求
  etagValidate,
}) => {
  let response = {}

  //error
  if(data && data.err) {
    response = {
      success: false,
      res: {
        ...data.res
      }
    }
  }
  //success
  else {

    response = {
      success: true,
      res: {
        ...data
      }
    }

    //another status
    if(!!anotherResponse && typeof anotherResponse === 'function') {
      response = anotherResponse(ctx, {...response})
    }
    //304 | 200
    else {
      // ctx.status = 200

      //304 暂不使用
      if(false) {

        let cache = false

        if(typeof etagValidate === 'function') {
          cache = etagValidate(ctx, response)
        }else {
          const updatedAt = filterField(data)
          cache = !!updatedAt && judgeCache(ctx, updatedAt, _etagValidate)
        }

        if(cache) {
          ctx.status = 304
          response = {
            ...response,
            res: {
              data: {}
            }
          }
        }
        
      }
    }

    if(afterDeal && typeof afterDeal === 'function') response = afterDeal({...response})

  }

  log4RequestAndResponse(ctx, response)
  
  const mediaDealData = mediaDeal(response)
  ctx.body = mediaDealData
  // ctx.body = response

}

module.exports = {
  notFound,
  dealErr,
  withTry,
  judgeCache,
  responseDataDeal,
  parseData
}