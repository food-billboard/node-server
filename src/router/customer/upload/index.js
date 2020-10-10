const Router = require('@koa/router')
const Chunk = require('./routes')
const { 
  verifyTokenToData,
  responseDataDeal,
  dealErr,
  isType,
  Params
} = require('@src/utils')
const { dealMedia, base64Size, base64Reg, randomName } = require('./util')

const router = new Router()

const MAX_FILE_SIZE = 1024 * 500

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
    console.log(err)
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

module.exports = router