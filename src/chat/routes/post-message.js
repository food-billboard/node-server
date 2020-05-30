const { MongoDB, otherToken } = require("@src/utils")

const mongo = MongoDB()

const TEMPLATE_MESSAGE = {
  user_info: {
    type: '',
    id: ''
  },
  point_to: null,
  type: '',
  content: {
    text: '',
    video: '',
    image: ''
  },
  room: null,
  create_time: Date.now()
}

const sendMessage = socket => async (data) => {
  let mine
  let templateMessage = { ...TEMPLATE_MESSAGE }
  let originRoomId
  let originRoomMember
  const {  
    content,
    type,
    _id:roomId,
    point_to
  } = data
  const objectRoomId = mongo.dealId(roomId)
  // const [, token] = verifyTokenToData(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token

  await Promise.all([
    mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile)
    }, {
      projection: {
        _id: 1
      }
    })),
    mongo.connect("room")
    .then(db => db.find({
      $or: [
        {
          origin: false,
          _id: objectRoomId
        },
        {
          origin: true
        }
      ]
    }, {
      projection: {
        origin: 1,
        type: 1,
        member: 1
      }
    }))
    .then(data => data.toArray())
  ])
  .then(([userInfo, roomMember]) => {
    const { _id } = userInfo
    mine = _id
    let member
    let roomType
    let auth = true
    roomMember.forEach(r => {
      const { type, origin, _id, member:_member } = r
      if(origin) {
        originRoomId = _id
        originRoomMember = [..._member]
      }else {
        roomType = type
        member = [..._member]
      }
      if(origin && mongo.equalId(_id, objectRoomId)) auth = false
    })

    if(!auth) return Promise.reject({errMsg: '无法与系统建立聊天', status: 403})
    if(!member.some(m => m.user && mongo.equalId(m.user, _id))) return Promise.reject({errMsg: '无权限', status: 403})

    const { content:template } = templateMessage
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
    templateMessage = {
      ...templateMessage,
      user_info: {
        type: 'user',
        id: _id,
      },
      room: objectRoomId,
      point_to: point_to ? point_to : null,
      content: { ...newContent },
      create_time: Date.now()
    }
  })
  .then(_ => mongo.connect("message"))
  .then(db => db.insertOne({
    ...templateMessage
  }))
  .then(data => {
    const { ops } = data
    const { _id:messageId } = ops[0]
    return messageId
  })
  .then(async (data) => {
    const memberData = await mongo.connect("room")
    .then(db => db.updateMany({
      _id: objectRoomId,
      origin: false,
    }, {
      $push: { 
        "member.message": {
          id: data,
          readed: false 
        }
      }
    }))
    .then(_ => mongo.connect("room"))
    .then(db => db.findOneAndUpdate({
      _id: objectRoomId,
      origin: false,
      "member.user": mine
    }, {
      $set: { "member.$[message].message.$[user].readed": true }
    }, {
      arrayFilsters: [
        {
          message: {
            $type: 'object'
          },
          "message.user": mine
        },
        {
          user: {
            $type: 'object'
          },
          "user.readed": false
        }
      ],
      projection: {
        member: 1
      }
    }))
    const { value } = memberData
    return {
      message: {
        ...templateMessage,
        _id: data
      },
      roomData: {
        ...value
      }
    }
  })
  .then(async (data) => {
    const { message, roomData: { member } } = data
    //记录不在线用户
    const offline = member.filter(m => m.status !== 'online').map(m => m.user)
    //对在线的直接进行广播
    const res = {
      _id,
      type:messageType,
      content:messageContent,
      create_time
    } = message
    socket.to(roomId).emit("message", JSON.stringify(res))
    //对在线不在房间的用户发送消息
    // let offlineUsersSocketId = offline.map(o => {
    //   const index = originRoomMember.findIndex((val) => mongo.equalId(o, val.user))
    //   if(~index) return originRoomMember[index].user
    //   return false
    // }).filter(user => user).forEach(user => socket.to(user).emit("get", {

    // }))
    
  })
  .then(_ => {
    //通知发送方发送完成
    socket.emit("post", JSON.stringify({ success: true, res: null }))
  })
  .catch(err => {
    console.log(err)
    socket.emit("post", JSON.stringify({ success: false, res: {err} }))
  })  
}

module.exports = sendMessage