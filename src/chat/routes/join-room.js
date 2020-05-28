const { MongoDB, verifySocketIoToken, isType } = require("@src/utils")

const mongo = MongoDB()

const JoinRoom = socket => async (data) => {
  const { type="chat", members } = data
  const [, token] = verifySocketIoToken(socket)
  const { mobile } = token
  if(type === 'system') {
    console.log('不能建立系统连接')
  }else {
    let hasRoom = false
    let roomId
    const mine = await mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile)
    }, {
      _id: 1
    }))
    .then(data => data._id)
    let newMembers = isType(members, 'array') ? members.map(m => mongo.dealId(m)) : [mongo.dealId(members)]
    if(!newMembers.some(m => mongo.equalId(m, mine))) newMembers.push(mine)
    //单聊
    if(type === 'chat' && mine) {
      await mongo.connect("room")
        .then(db => db.findOne({
          type,
          "member.user": { $in: [ ...newMembers ] }
        }, {
          _id: 1
        }))
      .then(data => {
        if(data) {
          hasRoom = true
          const { _id } = data
          roomId = _id.toString()
          socket.join(roomId)
        }
      })
    }
    if(!hasRoom) {
      let info = {
        create_time: Date.now(),
        modified_time: Date.now()
      }
      if(type === 'chat') {
        info = {
          ...info,
          avatar: null,
          name: null,
          description: null
        }
      }else {
        info = {
          ...info,
          avatar: '这里添加一个静态图片作为默认的群聊图片',
          name: '这是一个默认的名字',
          description: '群主什么都没有留下'
        }
      }
      await mongo.connect("room")
      .then(db => db.insertOne({
        type,
        info,
        member: newMembers.map(m => {
          return {
            user: m,
            status: mongo.equalId(m, mine) ? 'online' : 'offline',
            message: []
          }
        })
      }))
      .then(data => {
        const { ops } = data
        const { _id } = ops[0]
        roomId = _id.toString()
      })
    }
    socket.emit("join", JSON.stringify({
      _id: roomId
    }))
  }
}

const createRoom = socket => data => {

}

module.exports = JoinRoom

//离开房间
//断开连接