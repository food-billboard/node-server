const Koa = require('koa')
const Router = require('./src/index')
const Cors = require('koa-cors')

const app = new Koa()

app.use(Cors())
app.use(Router.routes()).use(Router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is run in port 3000')
})