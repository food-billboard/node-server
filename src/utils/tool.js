const path = require('path')
const Day = require('dayjs')
const { Types: { ObjectId } } = require('mongoose')
//静态资源目录
const STATIC_FILE_PATH = path.resolve(__dirname, '../../static')

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
    if(canAddNewProp || _obj[item] != undefined && target[item] != undefined) {
      if(!typeProto(_obj[item], 'object') || ObjectId.isValid(_obj[item])) {
        _obj[item] = target[item]
      }else {
        _obj[item] = mergeConfig(_obj[item], target[item])
      }
    }
  })
  return _obj
}

module.exports = {
  isType,
  isEmpty,
  flat,
  STATIC_FILE_PATH,
  formatISO,
  formatMill,
  NUM_DAY,
  mergeConfig,
  merge
}