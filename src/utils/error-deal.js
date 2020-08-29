const Day = requier('dayjs')

//错误处理
const dealErr = (ctx) => {
  return (err) => {
    let res = { success: false }
    if(err && err.errMsg) {
      const { status=500, ...nextErr } = err
      ctx.status = status
      res = {
        ...res,
        res: {
          ...nextErr
        }
      }
    }else {
      ctx.status = 500
      res = {
        ...res,
        res: {
          errMsg: err
        }
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

module.exports = {
  notFound,
  dealErr,
  withTry,
  judgeCache
}