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
  const { mobile } = token
  let res
  let errMsg
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id } = data
    return  mongo.connect("message")
    .then(db => db.find({
      send_to: _id
    }, {
      projection: {
        user_info: 1,
        "content.text": 1,
        readed: 1,
        create_time: 1
      }
    }))
    .then(data => data.toArray())
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
    const newData = data.map(d => {
      const { user_info, ...nextData } = d
      const { type, id }  = user_info
      return {
        ...nextData,
        user_info: {
          ...user_info,
          id: type === '__admin__' ? '__admin__' : id
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
  const { body: { _id } } = ctx.request
  let errMsg
  let res
  await mongo.connect("message")
    .then(db => db.updateOne({
      _id: mongo.dealId(_id)
    }, {
      $set: { readed: true }
    }))
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
.delete('/', async (ctx) => {
  const { _id } = ctx.query
  let res
  let errMsg
  await mongo.connect("message")
  .then(db => db.deleteOne({
    _id: mongo.dealId(_id)
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
    _id:send_to,
  } } = ctx.request
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
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
    .then(db => db.insertOne({
      ...TEMPLATE_MESSAGE,
      user_info: {
        type: 'user',
        id: _id
      },
      send_to,
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