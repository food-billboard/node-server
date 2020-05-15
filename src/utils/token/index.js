const jwt = require('jsonwebtoken')
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('不支持 crypto');
}

//秘钥
const SECRET = "________SE__C_R__E_T"

const MIDDEL = "MIDDEL"

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
    password,
    middel: MIDDEL
  }, SECRET, newOptions, newCallback)
}

const verifyToken = token => jwt.verify(token, SECRET)

//中间件验证token
const middlewareVerifyToken = async (ctx, next) => {
  const { header } = ctx.req
  const token = "token"

  try{
    const { middel } = verifyToken(token)
    if(MIDDEL === middel) {
      ctx.status = 200
      await next()
    }else {
      ctx.status = 401
      ctx.body = JSON.stringify({
        success: false,
        res: null
      })
    }
  }catch(err) {
    ctx.status = 401
    ctx.body = JSON.stringify({
      success: false,
      res: {
        data: '请求失败'
      }
    })
  }
}

//token验证并返回内容
const verifyTokenToData = (ctx) => {
  const { header } = ctx.req
  const token = "token"
  try { 
    const { middel, ...nextToken } = verifyToken(token)
    return [null, nextToken]
  }catch(err) {
    return [err, null]
  }
}

module.exports = {
  encoded,
  signToken,
  middlewareVerifyToken,
  verifyTokenToData
}