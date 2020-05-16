const Koa = require('koa')
require('module-alias/register')
const Router = require('./src/index')
const Cors = require('koa-cors')
// const bodyParser = require('koa-bodyparser')
const KoaBody = require('koa-body')
const app = new Koa()

app.use(Cors())
// app.use(bodyParser())
app.use(KoaBody({
  multipart:true, // 支持文件上传
  // encoding:'gzip',
  // formidable:{
  //   uploadDir:path.join(__dirname,'public/upload/'), // 设置文件上传目录
  //   keepExtensions: true,    // 保持文件的后缀
  //   maxFieldsSize:2 * 1024 * 1024, // 文件上传大小
  //   onFileBegin:(name,file) => { // 文件上传前的设置
  //     // console.log(`name: ${name}`);
  //     // console.log(file);
  //   },
  // }
}))
app.use(Router.routes()).use(Router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is run in port 3000')
})