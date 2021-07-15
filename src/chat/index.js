const Koa = require("koa")
require('module-alias/register')
const Ws = require('socket.io')
const http = require('http')
const { 
  MongoDB, 
} = require("@src/utils")
const { connection } = require('./utils')
const Router = require("./routes")

MongoDB()

const app = new Koa()

const server = http.createServer(app.callback())

server.listen(3001)

const io = Ws(server, {
  cors: {
    origin: true,
  },
})

io
.use(connection)
.on("connection", Router(io)) 