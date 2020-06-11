const fs = require('fs')
const path = require('path')
const { ImageModel, VideoModel, UserModel } = require('./mongodb/mongo.lib')
const { Types: { ObjectId } } = require('mongoose')

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
      const data = await callback(...args)
      return [null, data]
    }catch(err) {
      return [err, null]
    }
  }
}

//图片内容上传处理
/**
 * 
 * @param  {...any} files { file: 文件, auth: 权限类型[ PUBLIC, PRIVATE ], origin: 来源作者 | ORIGIN }
 */
const dealMedia4Image = async (...files) => {
  const realFiles = files.filter(f => isType(f.file, 'file') || istType(f.file, 'blob'))
  realFiles.forEach(async (obj) => {
    const { file, auth, origin } = obj
    const { type } = file
    if(/^image/.test(type)) return
    const fileReader = new FileReader()
    fileReader.onload = function(e) {
      const data = fileReader.result

      let path = '/media/database/'
      if(auth === 'PRIVATE') {
        path += 'private'
      }else {
        path += 'public'
      }

      path += '/image'
      const imageModel = new ImageModel({
        name: '',
        src: ''
      })
      UserModel.findOne({
        _id: ObjectId(origin)
      })
      imageModel.save().then(data => {
        const { _id } = data
        fs.writeFileSync(`${_id.toString()}.`)
      })
      await 
      fs.writeFileSync()
    }

    fileReader.readAsArrayBuffer(file)
  })
}

//大文件分片上传
const chunkLoad = async () => {

}

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

// function check(origin, target) {
//   if(isEmpty(origin) && !isEmpty(target)) return false
//   return Object.keys(origin).every(key => {
//     if(!target.includes(key)) return true
//     console.log(origin[key])
//     return origin[key] !== undefined
//   })
// }

// //参数预检查
// const paramsCheck = {
//   put: (params) => {
//     return async (ctx, next) => {
//       const { method } = ctx
//       if(!Array.isArray(params) || method.toLowerCase() !== 'put') return await next()
//       const { body } = ctx.request
//       if(check(body, params)) return await next()
//       ctx.status = 404
//       ctx.body = JSON.stringify({
//         success: false,
//         res: {
//           errMsg: 'not Found'
//         }
//       })
//     }
//   },
//   post: (params) => {
//     return async (ctx, next) => {
//       const { method } = ctx
//       if(!Array.isArray(params) || method.toLowerCase() !== 'post') return await next()
//       const { body } = ctx.request
//       if(check(body, params)) return await next()
//       ctx.status = 404
//       ctx.body = JSON.stringify({
//         success: false,
//         res: {
//           errMsg: 'not Found'
//         }
//       })
//     }
//   },
//   get: (params) => {
//     return async (ctx, next) => {
//       const { method } = ctx
//       if(!Array.isArray(params) || method.toLowerCase() !== 'get') return await next()
//       const { query } = ctx
//       if(check(query, params)) {
//         return await next()
//       }
//       ctx.status = 404
//       ctx.body = JSON.stringify({
//         success: false,
//         res: {
//           errMsg: 'not Found'
//         }
//       })
//     }
//   },
//   delete: (params) => {
//     return async (ctx, next) => {
//       const { method } = ctx
//       if(!Array.isArray(params) || method.toLowerCase() !== 'delete') return await next()
//       const { query } = ctx
//       if(check(query, params)) return await next()
//       ctx.status = 404
//       ctx.body = JSON.stringify({
//         success: false,
//         res: {
//           errMsg: 'not Found'
//         }
//       })
//     }
//   },
// }

module.exports = {
  isType,
  isEmpty,
  flat,
  withTry,
  dealMedia4Image,
  dealErr,
  // paramsCheck,
  notFound
}