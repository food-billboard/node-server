const Router = require('@koa/router')
const fs = require('fs')
const path = require('path')
const mime = require('mime')
const { path: root } = require('app-root-path')

// /api/backend/swagger/manage.html

const API_PATH = path.join(root, 'public')

const router = new Router()

const STATIC_PAGE_MAP = [
  {
    regexp: /(?<=.+\/three-model\/).+$/,
    path: "three-model"
  },
  {
    regexp: /(?<=.+\/tool-box\/).+$/,
    path: "tool-box"
  },
  {
    regexp: /(?<=.+\/my-home\/).+$/,
    path: "my-home"
  },
  {
    regexp: /(?<=.+\/communicate\/).+$/,
    path: "chat"
  },
  {
    regexp: /(?<=.+\/movie5\/).+$/,
    path: "movie5"
  },
  {
    regexp: /(?<=.+\/moviet5\/).+$/,
    path: "moviet5"
  },
  {
    regexp: /(?<=.+\/create-chart-docs\/).+$/,
    path: "create-chart-docs"
  },
  {
    regexp: /(?<=.+\/screen\/).+$/,
    path: "screen"
  },
  {
    regexp: /(?<=.+\/blog\/).+$/,
    path: "blog"
  },
  {
    regexp: /(?<=.+\/swagger\/).+$/,
    path: "api-docs"
  },
  {
    regexp: /(?<=.+\/backend\/).+$/,
    path: "manage"
  },
  {
    regexp: /(?<=.+\/test\/).+$/,
    path: "test"
  }
]

router
.get('/:path(.*)', async (ctx, _) => {
  const { URL: url } = ctx.request
  let name 
  let filePath = API_PATH
  const {
    origin,
    pathname
  } = new URL(url)
  const realUrl = origin + pathname

  const result = STATIC_PAGE_MAP.some(item => {
    const { regexp, path: dir } = item 
    const match = realUrl.match(regexp)
    if(match) {
      [name] = match
      filePath = path.join(filePath, dir, name)
      return true 
    }
    return false 
  })

  if(!result) {
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
    return ctx.status = 404
  }

  //查询文件的修改时间、缓存
  // const { request: { headers } } = ctx
  // const { mtime } = stat
  const _mime = mime.getType(extname)
  ctx.set('Content-Type', `${_mime};charset=utf-8`)
  // //304
  // const modified = headers['If-Modified-Since'] || headers['if-modified-since']
  // if(mtime == modified) {
  //   ctx.status = 304
  //   ctx.set({
  //     'last-modified': new Date(mtime)
  //   })
  //   return 
  // }

  // ctx.set({
  //   'last-modified': new Date(mtime)
  // })

  const data = fs.readFileSync(filePath)
  ctx.body = data
})


module.exports = router