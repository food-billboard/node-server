const Koa = require('koa')
require('module-alias/register')
const Router = require('./src/index')
const Cors = require('koa-cors')
const bodyParser = require('koa-bodyparser')

const app = new Koa()

app.use(Cors())
app.use(bodyParser())
app.use(Router.routes()).use(Router.allowedMethods())

app.listen(3000, () => {
  console.log('Server is run in port 3000')
})