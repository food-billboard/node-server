const Router = require('@koa/router')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { responseDataDeal, dealErr } = require('@src/utils')

// const API_PATH = path.resolve(__dirname, '../assets/api')
const API_PATH = path.resolve(__dirname, '../../public/manage')

const router = new Router()

router
.get('/:name', async (ctx, _) => {
  const { url, request: { method } } = ctx
  if(method.toLowerCase() !== 'get') {
    return ctx.status = 404
  }
  const [name] = url.match(/(?<=.+\/backend\/).+$/)
  const extname = path.extname(name)
  const filePath = path.resolve(API_PATH, name)

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
    const data = dealErr(ctx)({
      status: 404,
      errMsg: 'not Found'
    })
    responseDataDeal({
      ctx,
      data,
      needCache: false
    })
    return
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
    ctx.body = JSON.stringify({
      success: true,
      data: {}
    })
    return 
  }

  ctx.set({
    'Last-Modified': new Date(mtime)
  })

  const data = fs.readFileSync(path.resolve(API_PATH, name))
  ctx.body = data
})


module.exports = router