const path = require('path')
const Day = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')
const fs = require('fs')
const { checkAndCreateDir } = require('@src/router/customer/upload/util')
//静态资源目录
const STATIC_FILE_PATH = path.resolve(__dirname, '../../static')

//最大单次发送文件大小
const MAX_FILE_SINGLE_RESPONSE_SIZE = 1024 * 500

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

const DIR_LIST = {
  dir: 'static',
  path: STATIC_FILE_PATH,
  children: [
    {
      dir: 'public',
      path: path.resolve(STATIC_FILE_PATH, 'public'),
      children: [
        {
          dir: 'image',
          path: path.resolve(STATIC_FILE_PATH, 'public/image'),
        },
        {
          dir: 'video',
          path: path.resolve(STATIC_FILE_PATH, 'public/video'),
        },
        {
          dir: 'other',
          path: path.resolve(STATIC_FILE_PATH, 'public/other'),
        }
      ]
    },
    {
      dir: 'private',
      path: path.resolve(STATIC_FILE_PATH, 'private'),
      children: [
        {
          dir: 'image',
          path: path.resolve(STATIC_FILE_PATH, 'private/image'),
        },
        {
          dir: 'video',
          path: path.resolve(STATIC_FILE_PATH, 'private/video'),
        },
        {
          dir: 'other',
          path: path.resolve(STATIC_FILE_PATH, 'private/other'),
        }
      ]
    },
    {
      dir: 'template',
      path: path.resolve(STATIC_FILE_PATH, 'template'),
    }
  ]
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

module.exports = {
  isType,
  isEmpty,
  flat,
  STATIC_FILE_PATH,
  MAX_FILE_SINGLE_RESPONSE_SIZE,
  formatISO,
  formatMill,
  NUM_DAY,
  uuid,
  mergeConfig,
  merge,
  initStaticFileDir
}