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
  .then(data => {
    mongo.connect("room")
    .then(db => db.updateOne({
      _id: objectRoomId,
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
    .then(db => db.updateOne({
      _id: objectRoomId,
      "member.user": mine
    }, {
      $push: { "member.$.message": { 
        id: data,
        readed: true
      } }
    }))
    return {
      ...templateMessage,
      _id: data
    }
  })
  .then(async (message) => {
    //用户在线
    if('判断接收方是否在线') {
      const res = {
        _id,
        type,
        content,
        create_time
      } = message
      socket.emit('message', JSON.stringify({success: true, data: res}))
    }else {
      //刷新获取所有数据
      getMessage(socket)({})
    }
    socket.emit("post", JSON.stringify({ success: true, res: null }))
  })
  .catch(err => {
    console.log(err)
    socket.emit("post", JSON.stringify({ success: false, res: {err} }))
  })  
}

module.exports = sendMessage