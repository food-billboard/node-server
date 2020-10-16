const Koa = require('koa')
require('module-alias/register')
const Router = require('./src/index')
const Cors = require('koa-cors')
const KoaStatic = require('koa-static')
const KoaBody = require('koa-body')
const app = new Koa()
const path = require('path')
const { MongoDB, StaticMiddleware, initStaticFileDir, AccessLimitCheck, redisConnect, createMailTtransporter, sendMail } = require("@src/utils")
const { request, middleware4Uuid } = require('@src/config/winston')
const morgan = require('koa-morgan')

//数据库启动
MongoDB()
//初始化静态资源目录
initStaticFileDir()
//redis服务启动
redisConnect()

app.use(Cors())
//请求前植入uuid来进行全链路的日志记录
.use(middleware4Uuid)
.use(morgan('combined', {
  stream: request.stream,
  skip: function (req, res) { return res.statusCode < 300 }
}))
// app.use(bodyParser())
//请求速率限制
.use(AccessLimitCheck)
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
.use(StaticMiddleware)
.use(KoaStatic(path.resolve(__dirname, 'static'), {
  setHeaders: (res, path, stats) => {

  },
  extensions: true
}))
.use(async (ctx, next) => {
  createMailTtransporter()
  sendMail({
    // 发件人 邮箱  '昵称<发件人邮箱>'
    // from: '"G" <>',
    // 主题
    subject: '激活验证码',
    // 收件人 的邮箱 可以是其他邮箱 不一定是qq邮箱
    to: '1xxxxxx@163.com',
    // 内容
    text: `您的激活验证码为：${123456}, 请24小时内有效，请谨慎保管。` ,
    //这里可以添加html标签
    html: '<a href="https://www.cnblogs.com/HJ412/">xxx</a>'
  }, (error, info) => {
    console.log(error, info)
  })
  
  ctx.body = '111111'

})
.use(Router.routes()).use(Router.allowedMethods())

app.listen( process.env.PORT || 4000, () => {
  console.log('Server is run in port 3000')
})

module.exports = app