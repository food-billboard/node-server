const Koa = require('koa')
require('module-alias/register')
const Router = require('./src/index')
const Cors = require('koa-cors')
const KoaStatic = require('koa-static')
const KoaBody = require('koa-body')
const app = new Koa()
const path = require('path')
const { MongoDB } = require("@src/utils")
const { request, middleware4Uuid } = require('@src/config/winston')
const morgan = require('koa-morgan')

MongoDB()

app.use(Cors())
//请求前植入uuid来进行全链路的日志记录
.use(middleware4Uuid)
.use(morgan('combined', {
  stream: request.stream,
  skip: function (req, res) { return res.statusCode < 300 }
}))
// app.use(bodyParser())
.use(KoaBody({
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
// 访问权限
// .use()
.use(KoaStatic(path.resolve(__dirname, 'static'), {}))
.use(Router.routes()).use(Router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is run in port 3000')
})
