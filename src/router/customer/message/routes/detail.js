const Router = require('@koa/router')
const { MongoDB, verifyTokenToData } = require("@src/utils")

const router = new Router()
const mongo = MongoDB()

// params: { id: 用户id, currPage, pageSize }

router.get('/', async (ctx) => {
  ctx.body = '详情'
  const [, token] = verifyTokenToData(ctx)
  const { mobile } = token
  const { id, pageSize, currPage } = ctx.query
  let res
  let _id = id
  //系统消息
  if(id === 'admin') {
    _id = "__admin__"
  }
  const [, data] = await mongo.findOne("_user_", {
    mobile
  }, {
    _id: 1
  })
  .then(data => {
    const { _id:userId } = data
    let search = {
      query: [
        {
          __type__: "sort",
          create_time: -1
        },
        ["limit", pageSize],
        ["skip", pageSize * currPage]
      ]
    }
    //系统消息
    if(_id !== id) {
      search = {
        ...search,
        send_to: userId,
        user_info: {
          type: "system",
          id: _id
        }
      }
    }else {
      search = {
        ...search,
        send_to: { $in: [ userId, _id ] },
        "user_info.id": { $in: [ _id, userId ] } 
      }
    }
    return mongo.find("_message_", {...search}, {
      type: 1,
      content: 1,
      readed: 1,
      create_time:1
    })
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
    return false
  })

  if(!data) {
    ctx.status = 500
    res = {
      success: false,
      res: null
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