const { MongoDB } = require("@src/utils")
const getMessage = require('./get-message')

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
  const { body: {  
    content,
    type,
    _id:roomId,
    point_to
  } } = data
  const objectRoomId = mongo.dealId(roomId)
  const [, token] = verifyTokenToData(data)
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
    .then(db => db.findOne({
      origin: false,
      _id: objectRoomId
    }, {
      type,
      member: 1
    }))
  ])
  .then(([userInfo, roomMember]) => {
    const { _id } = userInfo
    mine = _id
    const { member, type } = roomMember
    if(type === 'system') return Promise.reject({errMsg: '无法与系统建立聊天', status: 403})
    if(!member.some(m => mongo.equalId(m, _id))) return Promise.reject({errMsg: '无权限', status: 403})
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
    .then(db => db.updateOne({
      _id: objectRoomId,
      origin: false,
      "member.user": { $ne: mine }
    }, {
      $push: { 
        "member.message": {
          id: data,
          readed: false 
        }
      }
    }))
    .then(_ => mongo.connect("room"))
    .then(db => db.findAndUpdateOne({
      _id: objectRoomId,
      origin: false,
      "member.user": mine
    }, {
      $push: { "member.$.message": { 
        id: data,
        readed: true
      } }
    }, {
      projection: {
        member: 1
      }
    }))
    return {
      message: {
        ...templateMessage,
        _id: data
      },
      roomData: {
        ...memberData
      }
    }
  })
  .then(async (data) => {
    const { message, memberData: { member } } = data
    let online = []
    let offline = []
    //将在线和非在线归类
    member.forEach(m => {
      const { 
        user,
        status,
      } = m
      //用户在线
      if(status === 'online') {
        online.push(user)
      }else {
        offline.push(user)
      }
    })

    //对在线的直接进行广播
    const res = {
      _id,
      type,
      content,
      create_time
    } = message
    //io.to()
    //对不在线的进行id查找并查找其socketid
    return mongo.connect("user")
    .then(db => db.find({
      _id: { $in: [ ...offline ] }
    }, {
      projection: {
        socket: 1
      }
    }))
    .then(data => data.toArray())
    .then(data => {
      //外层查找相应的socketid
    })
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