const { MongoDB, verifySocketIoToken } = require("@src/utils")

const mongo = MongoDB()

const getDetail = socket => async (data) => {
  const [, token] = verifySocketIoToken(data)
  const { mobile } = token
  const { _id:roomId, startTime=Date.now(), pageSize=30, messageId } = data
  let res
  let errMsg
  let mine
  const result = await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => {
    const { _id } = data
    mine = _id
    return mongo.connect("room")
    .then(db => db.findOne({
      origin: false,
      _id: mongo.dealId(roomId),
      "member.user": { $in: [_id] }
    }))
  })
  .then(data => {
    if(!data) return Promise.reject({ errMsg: '无权限', status: 403 })
    return data
  })
  .then(data => {
    const {
      member
    } = data
    let message = []
    const userMessage = member.filter(m => mongo.equalId(m.user, mine))
    if(userMessage.length) message = [...userMessage[0].message]
    let messageIdList = []
    //单条数据
    if(messageId) {
      messageIdList.push(mongo.dealId(messageId))
    }else {
      messageIdList = [...messageIdList, ...message.map(m => m.id)]
    }
    return mongo.connect("message")
    .then(db => db.find({
      _id: { $in: [...messageIdList] },
      create_time: { $lt: startTime }
    }, {
      limit: pageSize,
      projection: {
        type: 1,
        content: 1,
        create_time:1
      }
    }))
  })
  .then(data => data.toArray())
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
        data: result
      }
    }
  }

  socket.emit("message", JSON.stringify(res))
  
}

module.exports = getDetail