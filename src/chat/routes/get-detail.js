const { MongoDB, verifySocketIoToken } = require("@src/utils")

const mongo = MongoDB()

const getDetail = async (data) => {
  const [, token] = verifySocketIoToken(data)
  const { mobile } = token
  const { _id:messageId, pageSize=0, currPage=30 } = data
  let res
  let errMsg
  let _id = messageId
  const data = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
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
    if(_id == '__admin__') {
      rules = {
        ...rules,
        send_to: userId,
        "user_info.type": "__admin__"
      }
    }else {
      rules = {
        ...rules,
        send_to: { $in: [ userId, _id ] },
        "user_info.id": { $in: [ mongo.dealId(_id), userId ] } 
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

  return res
}

module.exports = getDetail