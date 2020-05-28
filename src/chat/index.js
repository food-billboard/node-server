const Koa = require("koa")
require('module-alias/register')
const Ws = require('socket.io')
const Cors = require("koa-cors")
const Compress = require('koa-compress')
const http = require('http')
const { middlewareVerifyTokenForSocketIo } = require("@src/utils")
const Router = require("./routes")

const app = new Koa()

const server = http.createServer(app.callback())

server.listen(3000)

const io = new Ws(server, {/**config */})

io
.use(middlewareVerifyTokenForSocketIo)
.on("connection", Router)