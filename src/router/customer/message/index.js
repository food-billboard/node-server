const Router = require('@koa/router')
const Detail = require('./routes/detail')
const { MongoDB, verifyTokenToData, middlewareVerifyToken } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// get 
// put params: { id: 消息id }
// postdata: { 
  // content: 消息内容,
  // type: 消息类型(image | audio | text | video),
  // id: 用户id,
// }
// delete params: { id: 消息id }

router
.use(middlewareVerifyToken)
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router