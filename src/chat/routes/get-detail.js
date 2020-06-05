const { MongoDB, verifySocketIoToken, otherToken } = require("@src/utils")

const mongo = MongoDB()

const getDetail = socket => async (data) => {
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  const { _id:roomId, startTime=Date.now(), pageSize=30, messageId } = data
  let res
  let mine
  let messageList = []
  //已登录
  if(token) {
    const { mobile } = token
    messageList = await mongo.connect("user")
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
        _id: mongo.dealId(roomId),
        member: { $elemMatch: { user: _id, status: 'online' } }
      }, {
      }))
    })
    .then(data => {
      if(!data) return Promise.reject({ errMsg: '无权限或不存在', status: 403 })
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
      return messageIdList
    })
    .catch(err => {
      console.log(err)
      if(err && err.errMsg) {
        res = {
          success: false,
          res: {
            ...err
          }
        }
      }else {
        res = {
          success: false,
          res: {
            errMsg: err
          }
        }
      }
      return false
    })
  }
  //未登录
  else {
    messageList = await mongo.connect("room")
    .then(db => db.findOne({
      _id: mongo.dealId(roomId),
      origin: true
    }))
    .then(data => {
      if(!data) return Promise.reject({ errMsg: '权限不足' })
      const { message } = data
      let newMessage = []
      //消息指定查看或列表查看
      if(messageId) {
        newMessage.push(messageId)
      }else {
        newMessage = [ ...newMessage, ...message ]
      }
      return newMessage
    })
    .catch(err => {
      console.log(err)
      if(err && err.errMsg) {
        res = {
          success: false,
          res: {
            ...err
          }
        }
      }else {
        res = {
          success: false,
          res: {
            errMsg: err
          }
        }
      }
      return false
    })
  }

  if(Array.isArray(messageList)) {

    if(!messageList.length) {
      res = {
        success: true,
        res: {
          data: []
        }
      }
    }else {
      await mongo.connect("message")
      .then(db => db.find({
        _id: { $in: [...messageList] },
          create_time: { $lt: mine ? startTime : Date.now() }
        }, {
          limit: pageSize,
          projection: {
            type: 1,
            content: 1,
            create_time:1
          }
      }))
      .then(data => data.toArray())
      .then(data => {
        return data.map(d => {
          const { type, content: { text, video, image, audio }, ...nextData } = d
          let newContent
          switch(type) {
            case "IMAGE": 
              newContent = image
              break
            case "VIDEO":
              newContent = video
              break
            case "AUDIO":
              newContent = audio
              break
            case "TEXT":
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
      .then(data => {
        res = {
          success: true,
          res: {
            data
          }
        }
      })
      .catch(err => {
        if(err && err.errMsg) {
          res = {
            success: false,
            res: {
              ...err
            }
          }
        }else {
          res = {
            success: false,
            res: {
              errMsg: err
            }
          }
        }
        console.log(err)
      })
    }

  }

  socket.emit("message", JSON.stringify(res))
  
}

module.exports = getDetail