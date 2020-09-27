const Day = require('dayjs')
const { isType } = require('./tool')
const { encoded } = require('./token')

//错误处理
const dealErr = (ctx) => {
  return (err) => {
    console.log(err, 'it is error')
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
    return {
      err: true,
      res
    }
  }
}

const notFound = (data) => {
  if(!data) return Promise.reject({ errMsg: 'not Found', status: 404 })
  return data
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
  !!modified && ctx.set({ 'Last-Modified': modifiedTime.toString() })

  console.log(new Date(modified).toString() == new Date(modifiedTime).toString())

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
        if(Array.isArray(data[key]) || isType(data[key], 'object')) {
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
  etagValidate=_etagValidate
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

      //304
      if(needCache) {

        const updatedAt = filterField(data)
        
        if(!!updatedAt && judgeCache(ctx, updatedAt, etagValidate)) {
          console.log('缓存')
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

    // const { res: { updatedAt, ...nextRes }  } = response
    // response = {
    //   ...response,
    //   res: {
    //     ...nextRes
    //   }
    // }

    if(afterDeal && typeof afterDeal === 'function') response = afterDeal({...response})

  }

  // console.log(response)

  ctx.body = response

}

module.exports = {
  notFound,
  dealErr,
  withTry,
  judgeCache,
  responseDataDeal
}