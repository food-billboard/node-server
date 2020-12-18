const Router = require('@koa/router')
const Validator = require('validator')
const Mime = require('mime')
const Url = require('url')
const pick = require('lodash/pick')
const { Types: { ObjectId } } = require('mongoose')
const { 
  verifyTokenToData,
  responseDataDeal,
  dealErr,
  Params,
  VideoModel,
  ImageModel,
  OtherMediaModel,
  UserModel,
  notFound,
  MEDIA_STATUS,
  MEDIA_AUTH
} = require('@src/utils')
const { headRequestDeal, patchRequestDeal, postMediaDeal } = require('./utils')
const { dealMedia, base64Size, base64Reg, randomName } = require('./utils/util')

const models = [ImageModel, VideoModel, OtherMediaModel]

const router = new Router()

const MAX_FILE_SIZE = 1024 * 1024 * 6

//元数据验证获取
const METADATA = {
  'md5': {
    validator: data => Validator.isMD5(data),
    sanitizers: data => data
  },
  'auth': {
    validator: data => Object.keys(MEDIA_AUTH).includes(data),
    sanitizers: data => data.toUpperCase()
  },
  'chunk': {
    validator: data => {
      const _data = parseInt(data)
      return typeof _data === 'number' && _data > 0
    },
    sanitizers: data => parseInt(data)
  },
  'mime': {
    validator: data => !!Validator.isMimeType(data),
    sanitizers: data => data.toLowerCase()
  },
  'size': {
    validator: data => {
      const _data = parseInt(data)
      return typeof _data === 'number' && _data > 0
    },
    sanitizers: data => parseInt(data)
  },
  'name': {
    validator: () => true,
    sanitizers: data => data.slice(0, 20)
  }
}

router
// //token验证
// .use(async (ctx, next) => {
//   const [, token] = verifyTokenToData(ctx)

//   if(!token) {
//     const data = dealErr(ctx)({ errMsg: '未登录或登录过期', status: 401 })
//     responseDataDeal({
//       ctx,
//       data
//     })
//     return 
//   }

//   return await next()
// })
// //检查参数格式是否正确
// .use(async(ctx, next) => {
//   const { body: { files:base64Files=[] }, files={}, method } = ctx.request
//   const _method = method.toLowerCase()
//   if(_method == 'get' || _method == 'put') return await next() 

//   let errRes

//   //是否为空
//   if(!base64Files.length && !Object.values(files).length) {
//     errRes = {
//       errMsg: 'bad request with empty file list', 
//       status: 400
//     }
//   }
//   //base64文件格式是否正确
//   else if(!base64Files.every(item => {
//     const { file } = item
    
//     return typeof file === 'string' && (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(file) || base64Reg.test(file))})) {//base64Reg
//       errRes = {
//         errMsg: 'bad request with base64 file type', 
//         status: 400
//       }
//   }
//   //file格式是否正确
//   else if(!!Object.values(files).length && !Object.values(files).every(item => typeof item === 'object' && !!item.path && !!item.size)) {
//     errRes = {
//       errMsg: 'bad request with file type', 
//       status: 400
//     }
//   }

//   if(errRes) {
//     const data = dealErr(ctx)(errRes)
//     responseDataDeal({
//       ctx,
//       data,
//       needCache: false
//     })
//     return
//   }

//   return await next()

// })

.use(async(ctx, next) => {

  const { request: { headers } } = ctx
  const contentLength = headers['content-length'] || headers['Content-Length']

  if(contentLength >= MAX_FILE_SIZE) {
    responseDataDeal({
      ctx,
      data: dealErr(ctx)({ errMsg: 'request to large', status: 413 }),
      needCache: false
    })
    return
  }

  return await next()

})
//断点续传预查
.head('/', async(ctx) => {

  const { request: { headers } } = ctx

  const metadataKey = Object.keys(METADATA)

  const check = Params.headers(ctx, {
    name: 'tus-resumable',
    validator: [
      data => {
        return data === '1.0.0'
      }
    ]
  }, {
    name: 'upload-metadata',
    validator: [
      data => {
        if(!data) return false
        return (data.endsWith(',') ? data.slice(0, -1) : data).every(d => {
          const [ key, value ] = d.split(' ')
          return metadataKey.includes(key) && METADATA[key].validator(Buffer.from(value, 'base64').toString())
        })
      }
    ]
  })

  if(check) {
    ctx.status = 404
    return
  }

  const [ , token ] = verifyTokenToData(ctx)
  const { id: _id } = token

  const [ metadata ] = Params.sanitizers(headers, {
    name: 'upload-metadata',
    sanitizers: [
      data => {
        return (data.endsWith(',') ? data.slice(0, -1) : data).reduce((acc, cur) => {
          const [ key, value ] = cur.split(' ')
          acc[key] = Buffer.from(value, 'base64').toString()
          return acc
        }, {})
      }
    ]
  })

  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => headRequestDeal({
    metadata,
    ctx,
    user: {
      _id: ObjectId(_id),
      roles: data.roles
    }
  }))
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) return ctx.status = 500

  const { offset, id, type } = data
  //设置索引来帮助恢复上传
  ctx.set('Upload-Offset', offset)
  ctx.set('Tus-Resumable', headers['tus-resumable'] || '1.0.0')
  ctx.set('Location', `/api/customer/upload`)
  ctx.set('Upload-Length', metadata.size)

  ctx.status = 200

})
//分片上传
.patch('/', async(ctx) => {

  const { request: { headers } } = ctx

  const metadataKey = Object.keys(METADATA)

  const check = Params.headers(ctx, {
    name: 'upload-offset',
    validator: [
      data => {
        const _data = parseInt(data)
        return !Number.isNaN(_data) && _data >= 0
      }
    ]
  }, {
    name: 'content-type',
    validator: [
      data => data.toLowerCase() === 'application/offset+octet-stream'
    ]
  }, {
    name: 'upload-metadata',
    validator: [
      data => {
        if(!data) return false
        return data.split(',').every(d => {
          const [ key, value ] = d.split(' ')
          return metadataKey.includes(key) && METADATA[key].validator(Buffer.from(value, 'base64').toString())
        })
      }
    ]
  })

  if(check) return

  const [ , token ] = verifyTokenToData(ctx)
  const { id: _id } = token

  const [ metadata, offset ] = Params.sanitizers(headers, {
    name: 'upload-metadata',
    sanitizers: [
      data => {
        return data.split(',').reduce((acc, cur) => {
          const [ key, value ] = cur.split(' ')
          acc[key] = Buffer.from(value, 'base64').toString()
          return acc
        }, {})
      }
    ]
  }, {
    name: 'upload-offset',
    sanitizers: [
      data => parseInt(data)
    ]
  })

  const length = headers['content-length']

  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => patchRequestDeal({
    user: data,
    ctx,
    metadata: {
      ...metadata,
      offset,
      length
    }
  }))
  .catch(err => {
    console.log(err)
    return false
  })

  console.log(data)

  if(!data) return ctx.status = 500

  const { status, success, offset:nextOffset } = data

  //设置响应头
  ctx.set({
    'Upload-Offset': nextOffset
  })

  ctx.status = status

})
//restore|load ?load=...
.get('/', async(ctx) => {
  const { request: { url } } = ctx
  let data

  const { query } = Url.parse(url)

  if(!query) {
    data = Promise.reject({
      errMsg: 'bad request',
      status: 400
    })
  }else {
    data = Promise.resolve(query.split('&').slice(0, 1).reduce((acc, cur) => {
      const [ key, value ] = cur.split('=').map(str => str.trim())
      acc[key] = value
      return acc
    }, {}))
  }

  data = data
  .then(query => {
    const [ [ type, id ] ] = Object.entries(query)
    if(!Validator.isMD5(id)) return Promise.reject({ status: 400, errMsg: 'bad request' })
    
    //文件查找
    return Promise.allSettled(models.map(model => {
      return model.findOne({
        _id: ObjectId(id)
      })
      .select({
        "info.status": 1,
        "info.complete": 1,
        "info.size": 1,
        "info.chun_size": 1,
        auth: 1,
        white_list: 1,
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(notFound)
    }))
    .then(results => ({ results, type }))
    
  })
  .then(({
    results,
    type //load restore
  }) => {

    const index = results.findIndex(result => result.status === 'fulfilled')
    if(!~index) return Promise.reject({ errMsg: 'not found', status: 404 })
    const { info: { status } } = results[index]
    if(status === MEDIA_STATUS.COMPLETE) {
      return ''
    }else {
      return Promise.reject({ errMsg: '404', status: 404 })
    }

  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })

})
//删除--无用
.delete('/', async(ctx) => {
  responseDataDeal({
    ctx,
    data: {},
    needCache: false
  })
})
//新增
.post('/', async(ctx) => {

  const { request: { headers } } = ctx

  const metadataKey = Object.keys(METADATA)

  console.log(metadataKey)

  const check = Params.headers(ctx, {
    name: 'tus-resumable',
    validator: [
      data => {
        return data === '1.0.0'
      }
    ]
  }, {
    name: 'upload-metadata',
    validator: [
      data => {
        if(!data) return false
        return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').every(d => {
          const [ key, value ] = d.split(' ')
          return metadataKey.includes(key) && METADATA[key].validator(Buffer.from(value, 'base64').toString())
        })
      }
    ]
  })

  if(check) {
    ctx.status = 404
    return
  }

  const [ , token ] = verifyTokenToData(ctx)
  const { id: _id } = token

  const [ metadata ] = Params.sanitizers(headers, {
    name: 'upload-metadata',
    sanitizers: [
      data => {
        return (data.endsWith(',') ? data.slice(0, -1) : data).split(',').reduce((acc, cur) => {
          const [ key, value ] = cur.split(' ')
          acc[key] = Buffer.from(value, 'base64').toString()
          return acc
        }, {})
      }
    ]
  })

  const data = await UserModel.findOne({
    _id: ObjectId(_id)
  })
  .select({
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => postMediaDeal({
    metadata,
    ctx,
    user: {
      _id: ObjectId(_id),
      roles: data.roles
    }
  }))
  .catch(err => {
    console.log(err)
    return false
  })

  if(!data) return ctx.status = 500

  const { offset, id, type } = data
  //设置索引来帮助恢复上传
  ctx.set('Tus-Resumable', headers['tus-resumable'] || '1.0.0')
  ctx.set('Location', `/api/customer/upload`)
  // ctx.set('Upload-Length', metadata.size)

  ctx.status = 201

})

module.exports = router