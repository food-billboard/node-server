const Router = require('@koa/router')
const Validator = require('validator')
const Mime = require('mime')
const Url = require('url')
const pick = require('lodash/pick')
const { Types: { ObjectId } } = require('mongoose')
const Chunk = require('./routes')
const { 
  verifyTokenToData,
  responseDataDeal,
  dealErr,
  isType,
  Params,
  VideoModel,
  ImageModel,
  OtherMediaModel,
  UserModel,
  notFound,
  MEDIA_STATUS,
  MEDIA_AUTH
} = require('@src/utils')
const { headRequestDeal, patchRequestDeal, MEDIA_TYPE } = require('./utils')
const { dealMedia, base64Size, base64Reg, randomName, headRequestDeal } = require('./util')

const models = [ImageModel, VideoModel, OtherMediaModel]

const router = new Router()

const MAX_FILE_SIZE = 1024 * 1024 * 6

router
//token验证
.use(async (ctx, next) => {
  const [, token] = verifyTokenToData(ctx)

  if(!token) {
    const data = dealErr(ctx)({ errMsg: '未登录或登录过期', status: 401 })
    responseDataDeal({
      ctx,
      data
    })
    return 
  }

  return await next()
})
//检查参数格式是否正确
.use(async(ctx, next) => {
  const { body: { files:base64Files=[] }, files={}, method } = ctx.request
  const _method = method.toLowerCase()
  if(_method == 'get' || _method == 'put') return await next() 

  let errRes

  //是否为空
  if(!base64Files.length && !Object.values(files).length) {
    errRes = {
      errMsg: 'bad request with empty file list', 
      status: 400
    }
  }
  //base64文件格式是否正确
  else if(!base64Files.every(item => {
    const { file } = item
    
    return typeof file === 'string' && (/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(file) || base64Reg.test(file))})) {//base64Reg
      errRes = {
        errMsg: 'bad request with base64 file type', 
        status: 400
      }
  }
  //file格式是否正确
  else if(!!Object.values(files).length && !Object.values(files).every(item => typeof item === 'object' && !!item.path && !!item.size)) {
    errRes = {
      errMsg: 'bad request with file type', 
      status: 400
    }
  }

  if(errRes) {
    const data = dealErr(ctx)(errRes)
    responseDataDeal({
      ctx,
      data,
      needCache: false
    })
    return
  }

  return await next()

})
//对于大文件拒绝接收请求
.use(async(ctx, next) => {
  const { method } = ctx.request
  const { body: { files: base64Files=[] }, files={} } = ctx.request

  let error
  let data

  try{
    if(
      method.toLowerCase() !== 'post' 
      || 
      base64Files.reduce((acc, cur) => { 
        const { file } = cur
        acc += base64Size(file) || 0
        return acc
      }, 0) + 
      Object.values(files).reduce((acc, file) => { 
        acc += file.size || 0
        return acc
      }, 0) <= MAX_FILE_SIZE 
    ) return await next()
  }catch(err) {
    error = { errMsg: 'server error', status: 500 }
  }

  if(!error) {
    error = { errMsg: 'body to large', status: 413 }
  }

  data = dealErr(ctx)(error)
  responseDataDeal({
    ctx,
    data,
    needCache: false
  })
  
})
//文件上传
/**
 * auth: 权限级别 0(PUBLIC) 1(PRIVATE) 默认0-->不必传,
 * files -> ctx.request.body
 * [{
 *   file: base64,
 *   name: 名称-->不必传,
 *   mime: mime类型(base64不存在时使用此值)-->不必传
 * }]
 * files -> ctx.request
 * [{
 *  file: File
 * }]
 */
.post('/', async(ctx) => {

  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  const { request: { body: { files:base64 }, files:file } } = ctx
  let base64Files = []
  let fileFiles = []

  //预处理文件参数格式

  //auth
  const [ auth ] = Params.sanitizers(ctx.request.body, {
    name: 'auth',
    sanitizers: [
      data => typeof data !== 'string' || ['0', '1'].indexOf(data) ? 'PUBLIC' : (data == '1' ? 'PRIVATE' : 'PUBLIC')
    ]
  })
  //base64
  if(!!base64) {
    const [ _ ] = Params.sanitizers(ctx.request.body, {
      name: 'files',
      sanitizers: [
        data => data.map(item => {
          const { file, name, mime } = item
          let newMime = mime
  
          if(!newMime || !/^[a-zA-Z]+\/[a-zA-Z]$/.test(newMime)) {
            const [type] = file.match(/(?<=:).+(?=;)/)
            newMime = type
          }
          return {
            file,
            name: !!name ? name : randomName(),
            mime: newMime,
            size: base64Size(file)
          }
        })
      ]
    })
    base64Files = _
  }
  //file
  if(!!file) {
    const [ _ ] = Params.sanitizers(ctx.request, {
      name: 'files',
      sanitizers: [
        data => Object.keys(data).map(item => {
          return {
            file: data[item],
            size: data[item].size,
            name: data[item].name || randomName(),
            mime: data[item].type
          }
        })
      ]
    })
    
    fileFiles = _
  }

  const realFiles = [ ...base64Files, ...fileFiles ]

  //文件存储本地及数据库
  const data = await dealMedia(mobile, mobile, auth, ...realFiles)

  //判断是否存在失败项
  let fail = []
  let complete = []
  data.forEach(item => {
    if(item.status === 'fulfilled') {
      complete.push(item.value)
    }else {
      fail.push(item.reason || null)
    }
  })

  if(!!fail.length) {
    res = dealErr(ctx)({ status: 500, errMsg: 'unknown error', data: [...complete] })
  }else {
    res = [...complete]
  }

  responseDataDeal({
    ctx,
    data: res,
    needCache: false
  })

})
.use('/chunk', Chunk.routes(), Chunk.allowedMethods())

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
      validator: data => !!Mime.getType(data),
      sanitizers: data => Mime.getType(data)
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

  const { request: { headers } } = ctx

  const metadataKey = Object.keys(METADATA)

  const check = Params.headers(ctx, {
    name: 'Tus-Resumable',
    validator: [
      data => data === '1.0.0'
    ]
  }, {
    name: 'Upload-Metadata',
    validator: [
      data => {
        if(!!data) return false
        return data.split(',').every(d => {
          const [ key, value ] = d.split(' ')
          return metadataKey.includes(key) && METADATA[key].validator(Buffer.from(value, 'base64'))
        })
      }
    ]
  })

  if(check) return

  const [ , token ] = verifyTokenToData(ctx)
  const { _id } = token

  const [ metadata ] = Params.sanitizers(headers, {
    name: 'Upload-Metadata',
    sanitizers: [
      data => {
        return data.split(',').reduce((acc, cur) => {
          const [ key, value ] = cur.split(' ')
          acc[key] = Buffer.from(value, 'base64')
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

  if(typeof data !== 'number') return ctx.status = 500

  const { offset, id, type } = data
  //设置索引来帮助恢复上传
  ctx.set('Upload-Offset', offset)
  ctx.set('Tus-Resumable', headers['Tus-Resumable'] || '1.0.0')
  ctx.set('Location', `/api/customer/upload?type=${type}&auth=${auth}&id=${id}`)
  // ctx.set('Upload-Id', id)

  ctx.status = 200

})
//分片上传
.patch('/', async(ctx) => {

  const { request: { headers } } = ctx
  const check = Params.headers(ctx, {
    name: 'Upload-Offset',
    validator: [
      data => {
        const _data = parseInt(data)
        return !Number.isNaN(_data) && _data >= 0
      }
    ]
  }, {
    name: 'Content-Type',
    validator: [
      data => data.toLowerCase() === 'application/offset+octet-stream'
    ]
  })

  if(check) return

  const [ , token ] = verifyTokenToData(ctx)
  const { _id } = token

  const { query } = Url.parse(ctx.request.method)
  const metadata = query.split('&').reduce((acc, cur) => {
    const [ key, value ] = cur.split('=')
    acc[key] = value
    return acc
  }, {})
  const { id, type } = metadata

  const data = await ObjectId.isValid(id) && MEDIA_TYPE.includes(type) ? Promise.resolve() : Promise.reject(400)
  .then(_ => UserModel.findOne({
    _id: ObjectId(_id)
  }))
  .select({
    roles: 1
  })
  .exec()
  .then(data => !!data && data._doc)
  .then(notFound)
  .then(data => patchRequestDeal({
    user: data,
    ctx,
    metadata
  }))
  .catch(err => {
    console.log(err)
    return false
  })

  if(typeof data !== 'number') return ctx.status = 500

  //设置响应头
  ctx.set({
    'Upload-Offset': data
  })

  ctx.status = 204

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
.post('/', async(ctx) => {

  const { request: { headers } } = ctx

  const { auth, md5, length, chunks, mime, size, name, offset } = pick(headers, [
    'Upload-Auth',
    'Upload-Md5',
    'Upload-Length',
    'Upload-Chunk',
    'Upload-Mime',
    'Upload-Size',
    'Upload-Name',
    'Upload-Offset'
  ])

  const validator = [
    {
      value: auth,
      validator: () => isHash
    }
  ]

  let data

  //参数验证
  if(
    !Validator.isMD5(md5) ||
    !Validator.isMimeType(mime) ||
    !(typeof length !== 'number' || length <= 0) ||
    !(typeof size !== 'number' || size <= 0)
  ) {
    
    data = dealErr(ctx)({
      errMsg: 'bad request',
      status: 400
    })

  }else {

    

  }

  responseDataDeal({
    ctx,
    data,
    needCache: false
  })


})

module.exports = router