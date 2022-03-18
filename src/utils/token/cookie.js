let crypto;
try {
  crypto = require('crypto')
} catch (err) {
  console.log('不支持 crypto')
}

//秘钥
const SECRET = "________C__OO_K__I_E"

//密码加密
const encoded = (string) => {
  if(crypto) {
    const hmac = crypto.createHmac('sha256', SECRET)
    hmac.update(string)
    return hmac.digest('hex')
  }
  return string
}

const TOKEN_COOKIE = 'jstoken'

const COOKIE_MAP = {}

//设置cookie
const setCookieName = (name, parse=true) => {
  if(typeof name === 'string') {
    if(!!COOKIE_MAP[name]) return COOKIE_MAP[name]
    const encodedName = parse ? encoded(name) : name 
    COOKIE_MAP[name] = encodedName
    return encodedName
  }
}

COOKIE_MAP[TOKEN_COOKIE] = setCookieName(TOKEN_COOKIE)

//获取cookie
const getCookieName = (name, parse) => {
  if(!name) return
  if(typeof name === 'string') {
    if(!!COOKIE_MAP[name]) return COOKIE_MAP[name]
    return setCookieName(name, parse)
  }

}

//cookie设置类型
const SET_TYPE = {
  set: (ctx, key, data, options={}) => {
    ctx.cookies.set(key, data, {
      maxAge: 1000 * 60 * 60 * 24,
      domain: ctx.req.headers.host,
      path: '/',
      secure: false,
      // !暂时不要了，因为聊天demo哪里需要获取cookie  
      // isHttpOnly: true,
      ...options,
    })
  },
  delete: (ctx, key, data, options={}) => {
    ctx.cookies.set(key, data, {
      ...options,
      maxAge: 0
    })
  },
  get: (ctx, key) => {
    return ctx.cookies.get(COOKIE_MAP[key])
  }
}

// const COOKIE_MAP = {
//   '\\/api\\/user\\/(logon|register)': {
//     action: SET_TYPE.set,
//   },
//   '\\/api\\/user\\/signout': {
//     action: SET_TYPE.set,
//   }
// }


const setCookie = async (ctx, { key, value, options, type, parse }) => {
  // await next()
  const { request: { method, url }, status } = ctx
  // const { pathname } = Url.parse(url)
  if(status > 400 || status < 200) return
  //设置cookie
  // let config
  // const needToEdit = Object.keys(COOKIE_MAP).some(url => {
  //   const reg = new RegExp(url)
  //   config = COOKIE_MAP[url]
  //   return reg.test(pathname)
  // })
  // if(!needToEdit) return
  // const { action } = config

  return SET_TYPE[type](ctx, getCookieName(key, parse), value, options)
}

const getCookie = (ctx, key) => SET_TYPE.get(ctx, key)

module.exports = {
  setCookie,
  getCookie,
  TOKEN_COOKIE
  // getCookieName,
  // setCookieName
  // COOKIE_NAME
}