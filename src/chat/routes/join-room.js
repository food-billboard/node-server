const { MongoDB, verifySocketIoToken, isType, otherToken } = require("@src/utils")

const mongo = MongoDB()

const joinRoom = socket => async (data) => {
  const { type='chat', _id, members } = data
  const [, token] = otherToken(data.token)
  let res 
  let hasRoom = false
  let roomId
  //成员整合
  let newMembers = isType(members, 'array') ? members.map(m => mongo.dealId(m)) : [mongo.dealId(members)]

  //已登录
  if(token) {
    let mineId
    const { mobile } = token
    //获取用户id
    await mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile),
      status: 'SIGNIN'
    }, {
      projection: {
        _id: 1
      }
    }))
    .then(data => data && data._id)
    .then(data => {
      mineId = data
      if(data && !newMembers.some(m => mongo.equalId(m, mineId))) newMembers.push(data)
    })
    .then(_ => {
      if(_id || ( !_id && type === 'chat' )) {
        let query = {}
        if(!_id) {
          query = {
            type,
            "member.user": { $in: [ ...newMembers ] },
            "member.user": mineId
          }
        }else {
          query = {
            _id: mongo.dealId(_id),
            "member.user": mineId
          }
        }

        return mongo.connect("room")
        .then(db => db.findOneAndUpdate({
          ...query
        }, {
          $set: { "member.$.status": 'online' }
        }, {
          projection: {
            _id: 1
          }
        }))
        .then(data => {
          if(data && data.value && data.value._id) {
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
            return hasRoom
          }else if(!_id){
            return hasRoom
          }
          else {
            return Promise.reject({errMsg: '权限不足或参数错误或已在房间中'})
          }
        })
      }
      else {
        return hasRoom
      }
    })
    .then(async (status) => {
      //创建房间
      if(!status && type !== 'system') {
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
        }else if(type === 'group_chat'){
          info = {
            ...info,
            avatar: '这里添加一个静态图片作为默认的群聊图片',
            name: '这是一个默认的名字',
            description: '群主什么都没有留下'
          }
        }
        return mongo.connect("room")
        .then(db => db.insertOne({
          type,
          info,
          origin: false,
          member: newMembers.map(m => {
            return {
              user: m,
              status: mongo.equalId(m, mineId) ? 'online' : 'offline',
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
      return false
    })
  }
  //未登录
  else {
    if(type !== 'system') {
      res = {
        success: false,
        res: {
          errMsg: '未登录'
        }
      }
    }
    else if(!_id) {
      res = {
        success: false,
        res: {
          errMsg: '参数错误'
        }
      }
    }else {
      await mongo.connect("room")
      .then(db => db.findOne({
        _id: mongo.dealId(_id),
        origin: true
      }, {
        _id: 1
      }))
      .then(data => !!data && data._id)
      .then(data => {
        if(data) {
          socket.join(data.toString())
          res = {
            success: true,
            res: {
              data: {
                _id: data
              }
            }
          }
        }else {
          res = {
            success: false,
            res: {
              errMsg: '未登录'
            }
          }
        }
      })
    }
  }

  socket.emit("join", JSON.stringify(res))
}

//离开房间
const leaveRoom = socket => async (data) => {
  const { _id } = data
  // const [, token] = verifySocketIoToken(data)
  const [, token] = otherToken(data.token)
  let mineId = null
  let res
  if(token) {
    const { mobile } = token
    mineId = await mongo.connect("user")
    .then(db => db.findOne({
      mobile: Number(mobile)
    }, {
      projection: {
        _id: 1
      }
    }))
    .then(data => data && data._id)
    .then(data => {
      return mongo.connect("room")
      .then(db => db.updateOne({
        _id: mongo.dealId(_id),
        "member.status": 'online',
        "member.user": data
      }, {
        $set: { "member.$.status": 'offline' }
      }))
    })
    .then(data => {
      if(data && data.result && !data.result.nModified) return Promise.reject({ errMsg: '权限不足' })
      res = {
        success: true,
        res: null
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
  }else {
    res = {
      success: true,
      res: null
    }
  }

  socket.leave(_id)
  socket.emit("leave", JSON.stringify(res))
}

module.exports = {
  leaveRoom,
  joinRoom
}