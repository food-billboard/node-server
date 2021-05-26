const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, RoomModel, dealErr, Params, responseDataDeal, ROOM_TYPE, parseData } = require('@src/utils')

async function joinSystemMethod(data, token) {
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

async function roomExists(data, token) {
  const { _id, members, type } = data
  const { id: userId } = token
  if(ObjectId.isValid(_id) || ( !ObjectId.isValid(_id) && type === ROOM_TYPE.CHAT ) || type === ROOM_TYPE.SYSTEM) {
    let query = {}
    if(type === ROOM_TYPE.SYSTEM) {
      query = {
        type,
        origin: true,
        "members.user": ObjectId(userId)
      }
    }else if(!ObjectId.isValid(_id)) {
      query = {
        type,
        "members.user": { $in: members },
      }
    }else {
      query = {
        _id: ObjectId(_id),
        "members.user": ObjectId(userId)
      }
    }

    return RoomModel.findOneAndUpdate(query, {
      $set: { "members.$.status": ROOM_USER_NET_STATUS.ONLINE }
    })
    .select({
      _id: 1
    })
    .exec()
    .then(parseData)
    .then(data => {
      if(data) {
        const { _id } = data
        const roomId = _id.toString()
        res = {
          success: true,
          res: {
            _id: roomId
          }
        }
        return res
      }else if(!_id) {
        return false
      }else {
        return Promise.reject({errMsg: '权限不足或参数错误或已在房间中'})
      }
    })
  }
  return false
}

async function paramsValid(data, token) {
  const { _id, members, type } = data
  if(type === ROOM_TYPE.SYSTEM) {
    return null 
  }
  if(!token) {
    return {
      errMsg: '未登录'
    }
  }
  if(!ObjectId.isValid(_id) && (!Array.isArray(members) || !members.length)) {
    return {
      errMsg: '成员参数不正确'
    }
  }
  if(type === ROOM_TYPE.CHAT && !!ObjectId.isValid(_id) && members.length != 1) {
    return {
      errMsg: "单聊参数不正确"
    }
  } 
}

const joinRoom = socket => async (data) => {
  const { type } = data
  const [, token] = verifySocketIoToken(data.token)
  const unValid = paramsValid(data, token)
  if(unValid) {
    socket.emit("join", JSON.stringify({
      success: false,
      res: unValid
    }))
    return 
  }

  const [ type, newMembers ] = Params.sanitizers(data, {
    name: 'type',
    _default: ROOM_TYPE.CHAT,
    sanitizers: [
      data => data.toUpperCase()
    ]
  }, {
    name: "members",
    sanitizers: [
      data => {
        if(typeof data != 'string' && !Array.isArray(data)) return []
        if(Array.isArray(data)) return data.filter(item => ObjectId.isValid(item)).map(item => ObjectId(item))
        return data.split(',').reduce((acc, cur) => {
          if(ObjectId.isValid(cur.trim())) acc.push(ObjectId(cur))
          return acc 
        }, [])
      }
    ]
  })

  let res 

  //已登录
  if(token) {
    const { id } = token
    if(!newMembers.some(item => item.equals(id))) newMembers.push(ObjectId(id))
    await roomExists({
      ...data,
      members: newMembers
    }, token)
    .then(data => {
      if(!data) return data 
      const { res: { _id } } = data 
      socket.join(_id)
      return data 
    })
    .then(async (status) => {
      //创建房间
      if(!status && type !== ROOM_TYPE.SYSTEM) {
        let info = {}
        if(type === ROOM_TYPE.CHAT) {
          info = {
            ...info,
            avatar: null,
            name: null,
            description: null
          }
        }else if(type === ROOM_TYPE.GROUP_CHAT){
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
          members: newMembers.map(m => {
            return {
              user: m,
              status: m.equals(id) ? ROOM_USER_NET_STATUS.ONLINE : ROOM_USER_NET_STATUS.OFFLINE,
            }
          })
        })
        return room.save()
        .then(data => {
          const { _id } = data
          const roomId = _id.toString()
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
    await joinSystemMethod(data, token)
  }

  socket.emit("join", JSON.stringify(res))
}