
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

module.exports = {
  notFound,
  dealErr,
  withTry
}