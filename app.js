require('dotenv').config()
const Koa = require('koa')
const Day = require('dayjs')
const Utc = require('dayjs/plugin/utc')
const Timezone = require('dayjs/plugin/timezone')
const QuarterOfYear = require('dayjs/plugin/quarterOfYear');
require('module-alias/register')
const Router = require('./src/index')
const Cors = require('koa-cors')
const KoaStatic = require('koa-static')
const KoaBody = require('koa-body')
const Compress = require('koa-compress')
const path = require('path')
const morgan = require('koa-morgan')
const chalk = require('chalk')
const helmet = require('koa-helmet')
const app = new Koa()
const { 
  koaTimeout,
  MongoDB, 
  StaticMiddleware, 
  initStaticFileDir, 
  AccessLimitCheck, 
  redisConnect, 
  authMiddleware, 
  notes_customer_behaviour_middleware,
} = require("@src/utils")
const { request, middleware4Uuid } = require('@src/config/winston')

//时区设置
Day.extend(Utc)
Day.extend(Timezone)
Day.extend(QuarterOfYear)
Day.tz.setDefault("China/BeiJing")

//数据库启动
MongoDB()
//初始化静态资源目录
initStaticFileDir()
//redis服务启动
redisConnect()

app
.use(Cors())
.use(helmet())
//请求前植入uuid来进行全链路的日志记录
.use(middleware4Uuid)
.use(morgan('combined', {
  stream: request.stream,
  skip: function (req, res) { return res.statusCode < 300 }
}))
//压缩
.use(Compress({
  filter (content_type) {
  	return /json/i.test(content_type)
  },
  threshold: 2048,
  br: false,
  gzip: {
    flush: require('zlib').constants.Z_SYNC_FLUSH
  },
  deflate: {
    flush: require('zlib').constants.Z_SYNC_FLUSH,
  },
}))
//请求速率限制
.use(AccessLimitCheck)
.use(KoaBody({
  multipart:true, // 支持文件上传
  // encoding:'gzip',
  // jsonLimit: 6 * 1024 * 1024,
  formLimit: 6 * 1024 * 1024,
  // textLimit: 6 * 1024 * 1024,
  // formidable:{
  //   uploadDir:path.join(__dirname,'public/upload/'), // 设置文件上传目录
  //   keepExtensions: true,    // 保持文件的后缀
  //   maxFileSize: 6 * 1024 * 1024, // 文件上传大小
  //   onFileBegin:(name,file) => { // 文件上传前的设置
 
  //   },
  // }
}))
// 设置超时时间为15s
.use(koaTimeout(45000))
//api访问权限
.use(authMiddleware)
//静态资源访问权限
.use(StaticMiddleware)
//用户行为记录
.use(notes_customer_behaviour_middleware)
.use(KoaStatic(path.resolve(__dirname), {
  setHeaders: (res, path, stats) => {

  },
  extensions: true,
  maxage: 1000 * 60 * 60 * 24,
  gzip: true
}))
//路由地址
.use(Router.routes()).use(Router.allowedMethods())

app.listen( process.env.PORT || 4000, () => {
  console.log(chalk.bgCyan('Koa Server is run in port 4000'))
})

module.exports = app