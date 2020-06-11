const { otherToken, UserModel, RoomModel, notFound } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

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
  let userInfo = {}
  let templateMessage = { ...TEMPLATE_MESSAGE }
  let originRoomId
  let originRoomMember
  const {  
    content,
    type,
    _id:roomId,
    point_to
  } = data
  const objectRoomId = ObjectId(roomId)
  // const [, token] = verifyTokenToData(data)
  const [, token] = otherToken(data.token)
  const { mobile } = token

  await Promise.all([
    UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1,
      username: 1,
      avatar: 1
    })
    .exec()
    .then(data => !!data && data._doc),
    RoomModel.find({
      $or: [
        {
          origin: false,
          _id: objectRoomId
        },
        {
          origin: true
        }
      ]
    })
    .select({
      origin: 1,
      type: 1,
      member: 1
    })
    .exec()
    .then(data => !!data && data)
  ])
  .then(data => data.filter(d => !!d).length == 2 && data)
  .then(notFound)
  .then(([info, roomMember]) => {
    userInfo = { ...info }
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
    if(!member.some(m => m.user && m.user.equals(userInfo._id) && m.status === 'ONLINE' )) return Promise.reject({errMsg: '无权限', status: 403})

    const { content:template } = templateMessage
    let newContent = { ...template }
    //存储图片内容
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
        type: 'USER',
        id: userInfo._id,
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
      "member.user": { $in: [ userInfo._id ] },
    }, {
      $push: { 
        "member.$[message].message": {
          id: data,
          readed: false 
        }
      }
    }, {
      arrayFilters: [
        {
          message: {
            $type: 3
          }
        }
      ]
    }))
    .then(_ => mongo.connect("room"))
    .then(db => db.findOneAndUpdate({
      _id: objectRoomId,
      origin: false,
      "member.user": userInfo._id
    }, {
      $set: { "member.$[message].message.$[user].readed": true }
    }, {
      arrayFilters: [
        {
          message: {
            $type: 'object'
          },
          "message.user": userInfo._id
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
    offline.map(o => {
      const index = originRoomMember.findIndex((val) => mongo.equalId(o, val.user) && !!val.sid)
      if(~index) return originRoomMember[index].sid
      return false
    }).filter(sid => sid).forEach(sid => {
        socket.to(sid).emit("new", {
        ...res, 
        username: userInfo.username
      })
    })
    
  })
  .then(_ => {
    //通知发送方发送完成
    res = {
      success: true, 
      res: null
    }
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
  })  

  socket.emit("post", JSON.stringify(res))
}

module.exports = sendMessage