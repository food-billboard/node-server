const { UserModel, RoomModel, MessageModel, notFound, Params, verifyTokenToData } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const sendMessage = socket => async (data) => {
  let userInfo = {}
  let templateMessage = {}
  let originRoomId
  let originRoomMember
  const check = Params.bodyUnStatsu(data, {
    name: 'content',
    validator: [
      data => typeof data === 'string'
    ]
  }, {
    name: 'type',
    validator: [
      data => !!data && ['IMAGE', 'TEXT', 'VIDEO', 'AUDIO'].includes(data)
    ]
  }, {
    name: '_id',
    type: [ 'isMongoId' ]
  })

  const [, token] = verifyTokenToData(data.token)
  if(check || !token) {
    socket.emit("post", JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad request'
      }
    }))
    return
  }

  const { mobile } = token
  const [ roomId, type ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  }, {
    name: 'type',
    sanitizers: [
      data => data.toUpperCase()
    ]
  })
  const {  
    content,
    point_to
  } = data

  templateMessage = { ...(point_to ? { point_to } : {}) }

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
          _id: roomId
        },
        {
          origin: true
        }
      ]
    })
    .select({
      origin: 1,
      type: 1,
      members: 1
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
      const { type, origin, _id, members:_member } = r
      if(origin) {
        originRoomId = _id
        originRoomMember = [..._member]
      }else {
        roomType = type
        member = [..._member]
      }
      if(origin && _id.equals(roomId)) auth = false
    })
    if(!auth) return Promise.reject({errMsg: '无法与系统建立聊天', status: 403})
    if(!member.some(m => m.user && m.user.equals(userInfo._id) && m.status === 'ONLINE' )) return Promise.reject({errMsg: '无权限', status: 403})

    let newContent = {}

    //对媒体内容进行存储233

    //存储图片内容
    switch(type) {
      case "IMAGE":
        newContent = {
          ...newContent,
          image: content
        }
        break
      case "VIDEO":
        newContent = {
          ...newContent,
          video: content
        }
        break
      case "AUDIO":
        newContent = {
          ...newContent,
          autio: content
        }
        break
      case "TEXT":
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
        _id: userInfo._id,
      },
      type,
      room: roomId,
      content: { ...newContent },
    }
    const messageItem = new MessageModel({
      ...templateMessage
    })
    return messageItem.save()
  })
  .then(data => !!data && data._id)
  .then(notFound)
  .then(async (data) => {
    const memberData = await RoomModel.updateOne({
      _id: roomId,
      origin: false,
      "members.user": { $in: [ userInfo._id ] }
    }, {
      $push: {
        "members.$[message].message": {
          _id: data,
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
    })
    .then(_ => RoomModel.findOneAndUpdate({
      _id: roomId,
      origin: false,
      "members.user": userInfo._id
    }, {
      $set: { "members.$[message].message.$[user].readed": true }
    }, {
      arrayFilters: [
        {
          message: {
            $type: 3
          },
          "message.user": userInfo._id
        },
        {
          user: {
            $type: 3
          },
          "user.readed": false
        }
      ],
    })
    .select({
      members: 1
    }))
    .then(data => !!data && data)
    .then(notFound)
    .catch(err => {
      console.log(err)
      return false
    })

    if(!memberData) return Promise.reject({errMsg: 'error', status: 404})
    const { members } = memberData
    return {
      message: {
        ...templateMessage,
        _id: data
      },
      roomData: {
        members
      }
    }
  })
  .then(async (data) => {
    const { message, roomData: { members } } = data

    //记录不在线用户
    const offline = members.filter(m => m.status !== 'online').map(m => m.user)
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
      const index = originRoomMember.findIndex((val) => o.equals(val.user) && !!val.sid)
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