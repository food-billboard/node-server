const { verifySocketIoToken, isType, notFound, UserModel, RoomModel, Params } = require("@src/utils")
const { Types: { ObjectId } } = require('mongoose')

const joinRoom = socket => async (data) => {
  const {  _id, members=[] } = data
  const [, token] = verifySocketIoToken(data.token)
  if(!_id && ( type.toUpperCase() === 'CHAT' ) && !members.length) {
    socket.emit("join", JSON.stringify({
      success: false,
      res: {
        errMsg: '单聊需要添加聊天对象'
      }
    }))
    return 
  }

  const [ type ] = Params.sanitizers(data, {
    name: 'type',
    _default: 'CHAT',
    sanitizers: [
      data => data.toUpperCase()
    ]
  })

  let res 
  let hasRoom = false
  let roomId

  //成员整合
  let newMembers = isType(members, 'array') ? members.map(m => ObjectId(m)) : ( ObjectId.isValid(members) ? [ObjectId(members)] : [] )

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
      if(!newMembers.some(m => mineId.equals(m))) newMembers.push(_id)
    })
    .then(_ => {
      if(_id || ( !_id && type === 'CHAT' ) || type === 'SYSTEM') {
        let query = {}
        if(type === 'SYSTEM') {
          query = {
            type,
            origin: true,
            "members.user": mineId
          }
        }else if(!_id) {
          query = {
            type,
            "members.user": { $in: [ ...newMembers ] },
            "members.user": mineId
          }
        }else {
          query = {
            _id: ObjectId(_id),
            "members.user": mineId
          }
        }

        return RoomModel.findOneAndUpdate({
          ...query
        }, {
          $set: { "members.$.status": 'ONLINE' }
        })
        .select({
          _id: 1
        })
        .exec()
        .then(data => !!data && data._doc)
        .then(data => {
          if(data) {
            const { _id } = data
            hasRoom = true
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
            avatar: ObjectId('5edb3c7b4f88da14ca419e61'),
            name: '这是一个默认的名字',
            description: '群主什么都没有留下'
          }
        }
        const room = new RoomModel({
          type,
          info,
          origin: false,
          members: newMembers.map(m => {
            return {
              user: m,
              status: mineId.equals(m) ? 'ONLINE' : 'OFFLINE',
              message: []
            }
          })
        })
        return room.save()
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
    else {
      await RoomModel.findOne({
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
      .catch(err => {
        console.log(err)
        res = {
          success: false,
          res: {
            errMsg: '未知错误'
          }
        }
      })
    }
  }

  socket.emit("join", JSON.stringify(res))
}

//离开房间
const leaveRoom = socket => async (data) => {
  const [, token] = verifySocketIoToken(data.token)
  const check = Params.bodyUnStatsu(data, {
    name: '_id',
    type: [ 'isMongoId' ]
  })
  if(check) {
    socket.emit("leave", JSON.stringify({
      success: false,
      res: {
        errMsg: 'bad request'
      }
    }))
    return
  }

  const [ _id ] = Params.sanitizers(data, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

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
    .then(data => !!data && data._doc)
    .then(data => {
      const { _id:userId } = data
      return RoomModel.updateOne({
        _id,
        "members.status": 'ONLINE',
        "members.user": userId
      }, {
        $set: { "members.$.status": 'OFFLINE' }
      })
    })
    .then(data => {
      if(data && data.nModified == 0) return Promise.reject({ errMsg: '权限不足' })
      res = {
        success: true,
        res: null
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
  }else {
    res = {
      success: true,
      res: null
    }
  }

  socket.leave(_id.toString())
  socket.emit("leave", JSON.stringify(res))
}

module.exports = {
  leaveRoom,
  joinRoom
}