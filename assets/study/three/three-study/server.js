const Koa = require('koa')
const Next = require('next')
const routes = require('./server')

const dev = process.env.NODE_ENV !== 'production'
const app = Next({ dev })
const handle = app.getRequestHandler()

function serverInit() {
  const server = new Koa()
  server
  //router
  .use(routes, routes.routes())
  .use(async (ctx, next) => {
    await handle(ctx.req, ctx.res)
    ctx.respond = false 
  })
  
  server.listen(5000, () => {
    console.log('server is run in port 5000')
  })
}

app.prepare()
.then(serverInit)