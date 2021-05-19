const path = require('path')
const Day = require('dayjs')
var isoWeek = require('dayjs/plugin/isoWeek')
const { pick } = require('lodash')
const { Types: { ObjectId } } = require('mongoose')
const fs = require('fs')
const { DIR_LIST, ROLES_MAP, API_DOMAIN } = require('./constant')

const fsPromise = fs.promises

Day.extend(isoWeek)

//检查是否存在文件夹
const checkDir = path => !fs.existsSync(path) || !fs.statSync(path).isDirectory()

//检查并创建文件夹
const checkAndCreateDir = (...paths) => paths.forEach(path => Array.isArray(path) ? checkAndCreateDir(path) : ( typeof path === 'string' && checkDir(path) && fs.mkdirSync(path)))

const typeProto = (arg, type) => Object.prototype.toString.call(arg) === `[object ${type.slice(0, 1).toUpperCase()}${type.slice(1)}]`

const isNumber = arg => !Number.isNaN(arg) && typeProto(arg, 'number')

const isString = arg => typeProto(arg, 'string')

const isFunction = arg => typeProto(arg, 'Function')

const isSymbol = arg => typeProto(arg, 'Symbol')

const isRegExp = arg => typeProto(arg, 'RegExp')

const _isNaN = arg => Number.isNaN(arg)

const isArray = arg => Array.isArray(arg)

const isObject = arg => typeProto(arg, 'Object')

const isNull = arg => typeProto(arg, 'Null')

const isUndefined = arg => typeof arg === undefined

const isFile = arg => typeProto(arg, 'File')

const isBlob = arg => typeProto(arg, 'Blob')

//symbol function regexp array number string object null undefined NaN blob file
const __type = {
  symbol: isSymbol,
  number: isNumber,
  nan: _isNaN,
  string: isString,
  function: isFunction,
  regexp: isRegExp,
  array: isArray,
  object: isObject,
  null: isNull,
  undefined: isUndefined,
  file: isFile,
  blob: isBlob
}

function isType(data, type) {
  let _type = String(type).toLowerCase()
  return __type[_type] && __type[_type](data)
}

function isEmpty(data) {
  if(isType(data, 'string')) {
    return !!!data.length
  }else if(isType(data, 'null') || isType(data, 'undefined')) {
    return true
  }else if(isType(data, 'array')) {
    return !!!data.length
  }else if(isType(data, 'object')) {
    return !!!Object.keys(data).length
  }
  return false
}

function flat(array) {
  if(!isType(array, 'array')) return array
  if(Array.prototype.flat) return array.flat(Infinity)
  let newArray = []
  array.forEach(item => {
    if(isType(item, 'array')) {
      const data = flat(item)
      newArray = [...newArray, ...data]
    }else {
      newArray.push(item)
    }
  })
  return newArray
}

function formatISO(date) { return Day(date).toISOString() }
function formatMill(date) { return Day(date).valueOf() }

function NUM_DAY(num) { return num * 24 * 60 * 60 * 1000 }

const uuid = () => {
  const s = []
  const hexDigits = '0123456789abcdef'
  for(let i = 0; i < 10; i ++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4'
  s[19] = hexDigits.substr(8, 1)
  return s.join('')
}


function merge(...restObject) {
  if(!restObject.length) return {}
  if(!isType(restObject[0], 'object')) return restObject[0]

  function internalMerge(origin, target) {
    if(!isType(origin, 'object') || !isType(target, 'object')) return origin
    
    Object.keys(target).forEach(key => {
      if(isType(origin[key], 'object') && isType(target[key], 'object')) {
        origin[key] = merge(origin[key], target[key])
      }else {
        origin[key] = target[key]
      }
    })
  
    return origin
    
  }

  for(let i = restObject.length - 1; i > 0; i --) {
    restObject[i-1] = internalMerge(restObject[i-1], restObject[i])
  }

  return restObject[0]

}

function mergeConfig(origin, target, canAddNewProp=false) {
  let _obj = {...origin}
  if(typeof _obj !== 'object') return _obj
  Object.keys(target).forEach(item => {
    if(canAddNewProp || (_obj[item] != undefined && target[item] != undefined)) {
      if(!typeProto(_obj[item], 'object') || ObjectId.isValid(_obj[item])) {
        _obj[item] = target[item]
      }else {
        _obj[item] = mergeConfig(_obj[item], target[item], canAddNewProp)
      }
    }
  })
  return _obj
}

//静态资源文件夹初始化
const initStaticFileDir = (dirList=DIR_LIST) => {
  Object.keys(dirList).forEach(dir => {
    if(dir == 'path') checkAndCreateDir(dirList.path)
    if(dir == 'children' && Array.isArray(dirList.children)) {
      dirList.children.forEach(child => {
        initStaticFileDir(child)
      })
    }
  })
}

//删除文件夹
const rmdir = (path) => {
  return fsPromise.stat(path)
  .then(({
    isFile
  }) => {

    if(isFile()) return fsPromise.unlink(path)

    return fsPromise.readdir(path)
    .then(fileList => {
      return Promise.all(fileList.map(file => rmdir(file)))
    })
    .then(_ => fsPromise.rmdir(path))

  })
}

const getIp = (ctx) => {
  const { req } = ctx
  const ip = req.headers['x-forwarded-for'] || // 判断是否有反向代理 IP
  req.connection.remoteAddress || // 判断 connection 的远程 IP
  req.socket.remoteAddress || // 判断后端的 socket 的 IP
  req.connection.socket.remoteAddress;

  return ip == '::1' ? 'localhost' : ip
}

const connectTry = (method, errMsg, times=5, interval=6000) => {
  let _times = 0
  return async function tryMethod() {
    try {
      await method()
      return Promise.resolve()
    }catch(err) {
      if(_times > times) return Promise.reject((errMsg ? errMsg.toString() : 'connect error') + err.toString())
      _times ++
      return setTimeout(async () => {
        await tryMethod()
      }, interval);
    }
  }
}

const avatarGet = (value, field='src') => {
  const method = Array.isArray(field) ? () => {
    return pick(value, field)
  } : () => value[field]
  return value ? method() : null
}

function formatMediaUrl(url) {
  if(typeof url !== 'string') return url
  return url.startsWith('http') ? url : (url.startsWith('/') ? `${API_DOMAIN}${url}` : `${API_DOMAIN}/${url}`)
}

function parseUrl(url) {
  if(!url.includes('http')) return url 
  if(url.includes('localhost:4000')) {
    const [ newUrl ] = url.match(/(?<=https?\:\/\/localhost\:4000).+/)
    return newUrl
  }else {
    const [ newUrl ] = url.match(/(?<=https?\:\/\/47.111.229.250).+/)
    return newUrl
  }
}

function cookieDomainSet(env) {
  const nodeEnv = env || (process.env.NODE_ENV === 'production' ? 'prod' : 'env')
  return nodeEnv.toLowerCase() == 'prod' ? '47.111.229.250' : 'localhost'
}

module.exports = {
  isType,
  isEmpty,
  flat,
  formatISO,
  formatMill,
  NUM_DAY,
  uuid,
  mergeConfig,
  merge,
  initStaticFileDir,
  checkDir,
  checkAndCreateDir,
  rmdir,
  getIp,
  connectTry,
  avatarGet,
  formatMediaUrl,
  parseUrl,
  cookieDomainSet
}