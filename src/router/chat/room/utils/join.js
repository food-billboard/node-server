const { Types: { ObjectId } } = require('mongoose')
const { 
  verifyTokenToData, 
  RoomModel, 
  dealErr, 
  Params, 
  responseDataDeal, 
  ROOM_TYPE, 
  parseData, 
  MemberModel, 
  ROOM_USER_NET_STATUS 
} = require('@src/utils')

async function roomExists(data, userId) {
  const { _id, members, type } = data
  if(ObjectId.isValid(_id) || ( !ObjectId.isValid(_id) && type === ROOM_TYPE.CHAT ) || type === ROOM_TYPE.SYSTEM) {
    let query = {}
    if(type === ROOM_TYPE.SYSTEM) {
      query = {
        type,
        origin: true,
      }
      if(ObjectId.isValid(userId)) query["members.user"] = userId
    }else if(!ObjectId.isValid(userId)) {
      return Promise.reject({
        errMsg: 'not authorization',
        status: 401
      })
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
        return _id.toString()
      }else if(!_id) {
        return false
      }else {
        return Promise.reject({errMsg: '权限不足或参数错误或已在房间中', status: 400})
      }
    })
  }
  return false
}

async function paramsValid(data) {
  const [, token] = verifyTokenToData(ctx)
  const { _id, members, type } = data
  if(type === ROOM_TYPE.SYSTEM) {
    return null 
  }
  if(!token) {
    return Promise.reject({
      errMsg: '未登录',
      status: 401
    })
  }
  if(!ObjectId.isValid(_id) && (!Array.isArray(members) || !members.length)) {
    return Promise.reject({
      errMsg: '成员参数不正确',
      status: 400
    })
  }
  if(type === ROOM_TYPE.CHAT && !!ObjectId.isValid(_id) && members.length != 1) {
    return Promise.reject({
      errMsg: "单聊参数不正确",
      status: 400
    })
  } 
}

async function formatMembers(prevMemebers, userId) {
  return MemberModel.findOne({
    user: userId
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data
    if(!prevMemebers.some(item => item.equals(_id))) return {
      mime: _id,
      members: [
        ...prevMemebers,
        _id 
      ] 
    }
    return {
      mime: _id,
      members: prevMemebers
    }
  })
}

const joinRoom = async (ctx) => {
  const [, token] = verifyTokenToData(ctx)

  let [ type, newMembers ] = Params.sanitizers(ctx.request.body, {
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
  let mimeId 

  const data = await paramsValid(ctx)
  .then(_ => {
    if(token) {
      return {
        memebers,
        mime: null
      }
    }
    return formatMembers(newMembers, ObjectId(token._id))
  })
  .then(({ members, mime }) => {
    mimeId = mime 
    newMembers = members 
    return roomExists({
      ...ctx.request.body,
      members: newMembers,
    }, token || mimeId)
  })
  .then(async (status) => {
    //创建房间
    if(!status) {
      if(type == ROOM_TYPE.SYSTEM) return Promise.reject({
        errMsg: 'forbidden',
        status: 403
      })
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
          const result = {
            user: m,
            status: ROOM_USER_NET_STATUS.OFFLINE
          }
          if(!token) return result 
          return {
            ...result,
            status: m.equals(mimeId) ? ROOM_USER_NET_STATUS.ONLINE : ROOM_USER_NET_STATUS.OFFLINE,
          }
        })
      })
      return room.save()
      .then(data => {
        const { _id } = data
        return _id 
      })
    }
    return status
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

}

module.exports = joinRoom