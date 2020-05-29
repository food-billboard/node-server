const { MongoDB, verifySocketIoToken, isType, otherToken } = require("@src/utils")

const mongo = MongoDB()

const joinRoom = socket => async (data) => {
  const { type="chat", _id, members } = data
  const [, token] = otherToken(data.token)
  const { mobile } = token
  let res 
  if(type === 'system') {
    console.log('不能建立系统连接')
    res = {
      success: false,
      res: {
        errMsg: '不能建立系统连接'
      }
    }
  }else {
    let hasRoom = false
    let roomId
    //获取用户id
    const mine = await mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile),
      status: 'SIGNIN'
    }, {
      projection: {
        _id: 1
      }
    }))
    .then(data => data && data._id)
    .catch(err => {
      console.log(err)
      res = {
        success: false,
        res: {
          errMsg: err
        }
      }
      return false
    })

    if(!mine) return socket.emit("join", JSON.stringify(res))
    
    //成员整合
    let newMembers = isType(members, 'array') ? members.map(m => mongo.dealId(m)) : [mongo.dealId(members)]
    if(!newMembers.some(m => mongo.equalId(m, mine))) newMembers.push(mine)

    let query = {}
    if(_id) {
      query = {
        _id: mongo.dealId(_id),
        "member.user": mine
      }
    }else {
      query = {
        type,
        "member.user": { $in: [ ...newMembers ] },
        "member.user": mine
      } 
    }
    if(_id || type === 'chat') {
      await mongo.connect("room")
      .then(db => db.findOneAndUpdate({
        ...query,
        origin: false
      }, {
        $set: { "member.$.status": 'online' }
      }, {
        projection: {
          _id: 1
        }
      }))
      .then(data => {
        //存在房间则直接加入
        if(data) {
          hasRoom = true
          const { value: { _id } } = data
          roomId = _id.toString()
          res = {
            success: true,
            res: {
              _id: roomId
            }
          }
          socket.join(roomId)
        }
      })
      .catch(err => {
        console.log(err)
        res = {
          success: false,
          res: {
            errMsg: err
          }
        }
      })
    }

    //创建房间
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
        res = {
          success: true,
          res: {
            _id: roomId
          }
        }
        socket.join(roomId)
      })
      .catch(err => {
        console.log(err)
        res = {
          success: false,
          res: {
            errMsg: err
          }
        }
      })
    }
    socket.emit("join", JSON.stringify(res))
  }
}

//离开房间
const leaveRoom = socket => async (data) => {
  const { _id } = data
  const [, token] = verifySocketIoToken(socket)
  const { mobile } = token
  let mineId
  let res

  await mongo.connect("user")
  .then(db => db.findOne({
    mobile: Number(mobile)
  }, {
    projection: {
      _id: 1
    }
  }))
  .then(data => data._id)
  .then(id => {
    mineId = id
  })
  .then(_ => mongo.connect("room"))
  .then(db => db.updateOne({
    _id: mongo.dealId(_id),
    "member.user": mineId,
    "member.status": 'online'
  }, {
    "member.$.status": 'offline'
  }))
  .then(_ => {
    socket.leave(_id)
    res = {
      success: true,
      res: {
        _id
      }
    }
  })
  .catch(err => {
    res = {
      success: false,
      res: {
        errMsg: err
      }
    }
  })

  socket.emit("leave", JSON.stringify(res))
}

const createRoom = socket => data => {

}

module.exports = {
  leaveRoom,
  joinRoom
}

//离开房间
//断开连接