const Router = require('@koa/router')
const Detail = require('./routes/detail')
const { MongoDB, withTry, verifyTokenToData, middlewareVerifyToken } = require("@src/utils")

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

const TEMPLATE_MESSAGE = {
  user_info: {
    type: '',
    id: ''
  },
  send_to: '',
  type: '',
  content: {
    text: '',
    video: '',
    image: ''
  },
  readed:false,
  create_time: Date.now()
}

router
.use(middlewareVerifyToken)
.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  let res
  let errMsg
  const { mobile } = token
  const data = await mongo.connect("message")
  .then(db => db.find({
    send_to: mobile
  }, {
    projection: {
      user_info: 1,
      "content.text": 1,
      readed: 1,
      create_time: 1
    }
  }))
  .then(data => data.toArray())
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })

  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    const newData = data.map(d => {
      const { user_info, ...nextData } = d
      const { type, id }  = user_info
      return {
        ...nextData,
        user_info: {
          ...user_info,
          id: type === '__admin__' ? 'admin' : id
        }
      }
    })
    res = {
      success: true,
      res: {
        data: newData
      }
    }
  }
  ctx.body = JSON.stringify(res)
})
.put('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { body: { _id } } = ctx.request
  let errMsg
  let res
  const data = await mongo.connect("message")
  .then(db => db.updateOne({
    send_to: mobile,
    _id: mongo.detalId(_id)
  }, {
    $set: { readed: true }
  }))
  .catch(err => {
    errMsg = err
    return false
  })

  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
  
})
.delete('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { body: { _id } } = ctx.request
  let res
  let errMsg
  const data = await mongo.connect("message")
  .then(db => db.deleteOne({
    send_to: mobile,
    _id: mongo.detalId(_id)
  }))
  .catch(err => {
    errMsg = err
    console.log(err)
    return false
  })

  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)
})
.post('/', async (ctx) => {
  let res
  let errMsg
  const { body: {  
    content,
    type,
    id,
  } } = ctx.request

  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id } = data
    const { content:template } = TEMPLATE_MESSAGE
    let newContent = { ...template }
    switch(type) {
      case "image":
        newContent = {
          ...newContent,
          image: content
        }
        break
      case "video":
        newContent = {
          ...newContent,
          video: content
        }
        break
      case "audio":
        newContent = {
          ...newContent,
          autio: content
        }
        break
      case "text":
      default:
        newContent = {
          ...newContent,
          text: content.toString()
        }
        break 
    }
    return mongo.connect("message")
    .then(db => db.insert({
      ...TEMPLATE_MESSAGE,
      user_info: {
        type: 'user',
        id: _id
      },
      send_to: id,
      content: {...newContent},
      readed:false,
      create_time: Date.now()
    }))
  })
  .catch(err => {
    console.log(err)
    errMsg = err
    return false
  })  

  if(errMsg) {
    ctx.status = 500
    res = {
      success: false,
      res: {
        errMsg
      }
    }
  }else {
    res = {
      success: true,
      res: null
    }
  }

  ctx.body = JSON.stringify(res)

})
.use('/detail', Detail.routes(), Detail.allowedMethods())

module.exports = router