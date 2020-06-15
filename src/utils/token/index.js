const jwt = require('jsonwebtoken')
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('不支持 crypto');
}
const { Types: { ObjectId } } = require('mongoose')
const { RoomModel } = require('../mongodb/mongo.lib');

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

const fileEncoded = (str) => {
  if(crypto) {
    const hmac = crypto.createHmac('md5', SECRET)
    hmac.update(str)
    return hmac.digest('hex')
  }
  return str
}

//创建token
const signToken = ({mobile, password}, options={expiresIn: '1d'}, callback=(err, token)=>{}) => {
  let newOptions = options, newCallback = callback
  if(typeof options === 'function') {
    newOptions = {}
    newCallback = options
  }
  return jwt.sign({
    mobile,
    password,
    middel: MIDDEL
  }, SECRET, newOptions)
}

const verifyToken = token => jwt.verify(token, SECRET)

//中间件验证token
const middlewareVerifyToken = async (ctx, next) => {
  const { header: {authorization} } = ctx.request
  const [err,] = getToken(authorization)
  if(!err) {
    ctx.status = 200
    await next()
  }else {
    switch(err) {
      case '400':
        ctx.status = 400
        ctx.body = JSON.stringify({
          success: false,
          res: {
            errMsg: '参数错误'
          }
        })
        break
      case '401':
        ctx.status = 401
        ctx.body = JSON.stringify({
          success: false,
          res: {
            errMsg: '未登录'
          }
        })
        break
      default:
        ctx.status = 500
        ctx.body = JSON.stringify({
          success: false,
          res: {
            errMsg: '服务端错误'
          }
        })
    }
  }
}

//socket.io中间件验证token
const middlewareVerifyTokenForSocketIo = socket => async (packet, next) => {
  const whiteList = ['disconnecting', 'get']
  const midList = ['message', 'leave', 'join']
  const [name, data] = packet
  const [, token] = verifySocketIoToken(socket)
  if(token) return await next()
  if(whiteList.includes(name)) return await next()
  if(midList.includes(name)) {
    const { _id } = data
      const roomData = await RoomModel.findOne({
        ...(_id ? { _id: ObjectId(_id) } : {}),
        type: 'SYSTEM'
      })
      .select({ _id: 1 })
      .exec()
      .then(data => data)
      if(roomData) {
        return await next()
      }else {
        socket.emit(name, JSON.stringify({
          success: false,
          res: {
            errMsg: 401
          }
        }))
      }
  }else {
    // next(new Error('401 unAuthorized'))
    socket.emit(name, JSON.stringify({
      success: false,
      res: {
        errMsg: 401
      }
    }))
  } 
}

//token验证并返回内容
const verifyTokenToData = (ctx) => {
  const { header: {authorization} } = ctx.request
  return getToken(authorization)
}

//socket验证token
const verifySocketIoToken = socket => {
  // const { handshake: { headers: { authorization } } } = socket
  // return getToken(authorization)
  const { handshake: { query: { token } } } = socket
  return otherToken(token)
}

const getToken = (authorization) => {
  if(!authorization) return ['400', null]
  const token = authorization.split(' ')[1]
  try { 
    const { middel, ...nextToken } = verifyToken(token)
    if(middel !== MIDDEL) return ['401', null]
    return [null, nextToken]
  }catch(err) {
    return [err, null]
  }
}

const otherToken = (token) => {
  try { 
    const { middel, ...nextToken } = verifyToken(token)
    if(middel !== MIDDEL) return ['401', null]
    return [null, nextToken]
  }catch(err) {
    return [err, null]
  }
}

module.exports = {
  encoded,
  signToken,
  middlewareVerifyToken,
  middlewareVerifyTokenForSocketIo,
  verifyTokenToData,
  verifySocketIoToken,
  otherToken,
  fileEncoded
}