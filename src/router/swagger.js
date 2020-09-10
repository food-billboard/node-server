const Router = require('@koa/router')
const fs = require('fs')
const path = require('path')

const API_PATH = path.resolve(__dirname, '../assets/api')

const router = new Router()

router
.get('/:name', async(ctx) => {
  const { url } = ctx
  const [name] = url.match(/(?<=.+\/swagger\/).+$/)
  const extname = path.extname(name)
  const filePath = path.resolve(API_PATH, name)

  let stat
  //判断文件是否存在
  try {
    const isExists = fs.existsSync(filePath)
    stat = fs.statSync(filePath)
    if(!isExists || !stat.isFile()) {
      ctx.status = 404
      ctx.body = 'not Found'
      return
    }
  }catch(_) {}

  //查询文件的修改时间、缓存
  const { request: { headers } } = ctx
  const { mtime } = stat
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
  ctx.set('Content-Type', `text/${extname.slice(1)};charset=utf-8`)
  ctx.body = data
})


module.exports = router