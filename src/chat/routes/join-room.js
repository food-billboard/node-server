const { verifySocketIoToken, isType, otherToken, notFound, UserModel, RoomModel } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const joinRoom = socket => async (data) => {
  const { type='CHAT', _id, members } = data
  const [, token] = otherToken(data.token)
  let res 
  let hasRoom = false
  let roomId
  //成员整合
  let newMembers = isType(members, 'array') ? members.map(m => ObjectId(m)) : [ObjectId(members)]

  //已登录
  if(token) {
    let mineId
    const { mobile } = token
    //获取用户id
    await UserModel.findOne({
      mobile: Number(mobile),
      status: 'SIGNIN'
    })
    .select({
      _id: 1
    })
    .then(data => !!data && data._doc)
    .then(notFound)
    .then(data => {
      const { _id } = data
      mineId = _id
      if(data && !newMembers.some(m => mineId.equals(m))) newMembers.push(data)
    })
    .then(_ => {
      if(_id || ( !_id && type === 'CHAT' )) {
        let query = {}
        if(!_id) {
          query = {
            type,
            "members.user": { $in: [ ...newMembers ] },
            "members.user": mineId
          }
        }else {
          query = {
            _id: mongo.dealId(_id),
            "members.user": mineId
          }
        }

        return RoomModel.findOneAndUpdate({
          ...query
        }, {
          $set: { "members.$.status": 'ONELINE' }
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !data && data._doc)
        .then(data => {
          const { _id } = data
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
            return hasRoom
          }else if(!_id) {
            return hasRoom
          }else {
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
      if(!status && type !== 'SYSTEM') {
        let info = {}
        if(type === 'CHAT') {
          info = {
            ...info,
            avatar: null,
            name: null,
            description: null
          }
        }else if(type === 'GROUP_CHAT'){
          info = {
            ...info,
            avatar: '这里添加一个静态图片作为默认的群聊图片',
            name: '这是一个默认的名字',
            description: '群主什么都没有留下'
          }
        }
        const room = new RoomModel({
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
        })
        room.save()
        .then(data => {
          const { _id } = data
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
    if(type !== 'SYSTEM') {
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
      await RoomModel.findOne({
        _id: ObjectId(_id),
        origin: true
      })
      .select({
        _id: 1
      })
      .exec()
      .then(data => !!data && data._doc)
      .then(data => {
        const { _id } = data
        if(data) {
          socket.join(_id.toString())
          res = {
            success: true,
            res: {
              data: {
                _id
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
    await UserModel.findOne({
      mobile: Number(mobile)
    })
    .select({
      _id: 1
    })
    .exec()
    .then(data => !!data && data.doc)
    .then(data => {
      const { _id:userId } = data
      return RoomModel.updateOne({
        _id: ObjectId(_id),
        "member.status": 'ONLINE',
        "member.user": userId
      }, {
        $set: { "member.$.status": 'OFFLINE' }
      })
    })
    .then(data => {
      if(!data) return Promise.reject({ errMsg: '权限不足' })
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