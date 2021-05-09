const Router = require('@koa/router')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { path: root } = require('app-root-path')

const API_PATH = path.join(root, 'public')

const router = new Router()

router
.get('/:path(.*)', async (ctx, _) => {
  const { url } = ctx
  let name 
  const backendMatch = url.match(/(?<=.+\/backend\/).+$/)
  const swaggerMatch = url.match(/(?<=.+\/swagger\/).+$/)
  const testMatch = url.match(/(?<=.+\/test\/).+$/)
  let filePath = API_PATH
  if(swaggerMatch) {
    [name] = swaggerMatch
    filePath = path.join(filePath, 'api-docs', name)
  }else if(testMatch) {
    [name] = testMatch
    filePath = path.join(filePath, 'test', name)
  }else if(backendMatch) {
    [name] = backendMatch
    filePath = path.join(filePath, 'manage', name)
  }else {
    return ctx.status = 404
  }
  const extname = path.extname(name)

  let stat
  //判断文件是否存在
  try {
    const isExists = fs.existsSync(filePath)
    stat = fs.statSync(filePath)
    if(!isExists || !stat.isFile()) {
      throw new Error()
    }
  }catch(_) {
    console.log(_)
    return ctx.status = 404
  }

  //查询文件的修改时间、缓存
  const { request: { headers } } = ctx
  const { mtime } = stat
  const _mime = mime.getType(extname)
  ctx.set('Content-Type', `${_mime};charset=utf-8`)
  //304
  const modified = headers['If-Modified-Since'] || headers['if-modified-since']
  if(mtime == modified) {
    ctx.status = 304
    ctx.set({
      'Last-Modified': new Date(mtime)
    })
    return 
  }

  ctx.set({
    'Last-Modified': new Date(mtime)
  })

  const data = fs.readFileSync(filePath)
  ctx.body = data
})


module.exports = router