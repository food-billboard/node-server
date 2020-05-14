const jwt = require('jsonwebtoken')
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('不支持 crypto');
}

//秘钥
const SECRET = "________SE__C_R__E_T"

const encoded = (password) => {
  if(crypto) {
    const hmac = crypto.createHmac('sha256', SECRET)
    hmac.update(password)
    return hmac.digest('hex')
  }
  return password
}

//创建token
const signToken = ({username, password}, options={expiresIn: '1d'}, callback=(err, token)=>{}) => {
  let newOptions = options, newCallback = callback
  if(typeof options === 'function') {
    newOptions = {}
    newCallback = options
  }
  return jwt.sign({
    username,
    password
  }, SECRET, newOptions, newCallback)
}

//验证token
const verifyToken = (successCallback, failCallback) => {
  return async (ctx, next) => {
    const { body: { token, mobile } } = ctx.request
    try{
      const { mobile: verifyData } = jwt.verify(token, SECRET)
      if(mobile === verifyData) {
        ctx.status = 200
        successCallback && successCallback(mobile)
        await next()
      }else {
        if(failCallback) {
          await failCallback(401, ctx)
        }else {
          ctx.status = 401
          await callback && callback(401)
          ctx.body = JSON.stringify({
            success: false,
            res: null
          })
        }
      }
    }catch(err) {
      if(failCallback) {
        await failCallback(err, ctx)
      }else {
        ctx.status = 401
        ctx.body = JSON.stringify({
          success: false,
          res: {
            data: '请求失败'
          }
        })
      }
    }
  }
}

module.exports = {
  encoded,
  signToken,
  verifyToken
}