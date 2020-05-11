const typeProto = arg => Object.prototype.toString.call(arg)

const isNumber = arg => !Number.isNaN(arg) && typeProto(arg) === '[object Number]'

const isString = arg => typeProto(arg) === '[object String]'

const isFunction = arg => typeProto(arg) === "[object Function]"

const isSymbol = arg => typeProto(arg) === "[object Symbol]"

const isRegExp = arg => typeProto(arg) === "[object RegExp]"

const _isNaN = arg => Number.isNaN(arg)

const isArray = arg => Array.isArray(arg)

const isObject = arg => typeProto(arg) === '[object Object]'

const isNull = arg => typeProto(arg) === "[object Null]"

const isUndefined = arg => typeof arg === undefined

//symbol function regexp array number string object null undefined NaN
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
  undefined: isUndefined
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

const withTry = (callback) => {
  return async (...args) => {
    try {
      const data = await callback(args)
      return [null, data]
    }catch(err) {
      return [err, null]
    }
  }
}

module.exports = {
  isType,
  isEmpty,
  flat,
  withTry
}