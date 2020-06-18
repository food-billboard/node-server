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
  try {
    if(!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      ctx.status = 404
      ctx.body = 'not Found'
    }
  }catch(_) {}
  const data = fs.readFileSync(path.resolve(API_PATH, name))
  ctx.set('Content-Type', `text/${extname.slice(1)};charset=utf-8`)
  ctx.body = data
})


module.exports = router