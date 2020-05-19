const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { id: 用户id, currPage, pageSize }

router.get('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { id, pageSize, currPage } = ctx.query
  let res
  let errMsg
  let _id = id
  //系统消息
  if(id === 'admin') {
    _id = "__admin__"
  }
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id:userId } = data
    let search = {
      sort: {
        create_time: -1
      },
      limit: pageSize,
      skip: pageSize * currPage
    }
    let rules = {}
    //系统消息
    if(_id !== id) {
      rules = {
        ...rules,
        send_to: userId,
        user_info: {
          type: "system",
          id: _id
        }
      }
    }else {
      rules = {
        ...rules,
        send_to: { $in: [ userId, _id ] },
        "user_info.id": { $in: [ _id, userId ] } 
      }
    }
    return mongo.connect("message")
    .then(db => db.find({
      ...rules
    }, {
      ...search,
      projection: {
        type: 1,
        content: 1,
        readed: 1,
        create_time:1
      }
    }))
    .then(data => data.toArray())
  })
  .then(data => {
    return data.map(d => {
      const { type, content: { text, video, image, audio }, ...nextData } = d
      let newContent
      switch(type) {
        case "image": 
          newContent = image
          break
        case "video":
          newContent = video
          break
        case "audio":
          newContent = audio
          break
        case "text":
        default:
          newContent = text
          break
      }
      return {
        ...nextData,
        type,
        content: newContent
      }
    })
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
      res: {
        data
      }
    }
  }

  ctx.body = JSON.stringify(res)

})

module.exports = router