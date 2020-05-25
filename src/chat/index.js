const Koa = require("koa")
const Ws = require('socket.io')
const Cors = require("koa-cors")
const Compress = require('koa-compress')
const http = require('http')
const Router = require("./routes")

const app = new Koa()

const server = http.createServer(app.callback())

server.listen(3000)

const io = new Ws(server, {/**config */})

io.on("connection", Router)