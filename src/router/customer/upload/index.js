const Router = require('@koa/router')
const Chunk = require('./routes')
const { 
  verifyTokenToData
} = require('@src/utils')
const { dealMedia, base64Size } = require('./util')

const router = new Router()

const MAX_FILE_SIZE = 1024 * 1024 * 5

router
//对于大文件拒绝接收请求
// .use(async(ctx, next) => {
//   const { method } = ctx.request
//   const { body: { files: base64Files={} }, files={} } = ctx.request
//   try{
//     if(
//       method.toLowerCase() !== 'post' 
//       || 
//       Object.values(base64Files).reduce((acc, file) => { acc + base64Size(file) }, 0) <= MAX_FILE_SIZE 
//       || 
//       Object.values(files).reduce((acc, file) => { acc + file.size }, 0) <= MAX_FILE_SIZE) return await next()
//   }catch(err) {
//     console.log(err)
//     ctx.status = 500
//     ctx.body = JSON.stringify({
//       success: false,
//       res: {
//         errMsg: 'server error'
//       }
//     })
//     return 
//   }
  
//   ctx.status = 413
//   ctx.body = JSON.stringify({
//     success: false,
//     res: {
//       errMsg: 'body to large'
//     }
//   })
// })
//文件上传
.post('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  let res
  const { body: { auth="PUBLIC", name, file, mime }, files={} } = ctx.request

  // const fileList = [...Object.values(nextFiles), ...Object.values(files)]

  const data = await dealMedia(mobile, mobile, auth, { file, mime, name })

  let fail = []
  let complete = []
  data.forEach(item => {
    if(item.status === 'fulfilled') {
      complete.push(item.value)
    }else {
      fail.push(item.reason || null)
    }
  })

  if(fail.length) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg: 'unknown error',
        data: [...complete]
      }
    }
  }else {
    res = {
      success: true,
      res: {
        data: [...complete]
      }
    }
  }

  ctx.body = JSON.stringify(res)

})
.use('/chunk', Chunk.routes(), Chunk.allowedMethods())

module.exports = router