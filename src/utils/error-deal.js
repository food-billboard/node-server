const Day = requier('dayjs')
const { isType } = require('./tool')

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
    console.log(err)
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
  const { request: { headers } } = ctx
  const modified = headers['if-modified-since'] || headers['If-Modified-Since']
  const etag = headers['if-none-match'] || headers['If-None-Match']
  return Day(modified).valueOf() === Day(modifiedTime).valueOf() && ( typeof etagValidate == 'function' ? etagValidate(etag) : true )
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
  needCache=true,
  anotherResponse,
  afterDeal
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
      response = anotherResponse({...response})
    }
    //304 | 200
    else {
      // ctx.status = 200

      //304
      if(needCache) {

        const updatedAt = filterField(data)
        
        if(updatedAt && judgeCache(ctx, updatedAt)) {
          ctx.status = 304
          response = {
            ...response,
            res: {}
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

    ctx.body = JSON.stringify(response)

  }

}

module.exports = {
  notFound,
  dealErr,
  withTry,
  judgeCache,
  responseDataDeal
}