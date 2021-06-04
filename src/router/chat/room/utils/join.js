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
  ROOM_USER_NET_STATUS,
  notFound
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
      if(ObjectId.isValid(_id)) query._id = _id 
      if(ObjectId.isValid(userId)) query["members"] = {
        $in: [userId]
      }
    }else if(!ObjectId.isValid(userId)) {
      return Promise.reject({
        errMsg: 'not authorization',
        status: 401
      })
    }else if(!ObjectId.isValid(_id)) {
      query = {
        type,
        "members": { $in: members },
      }
    }else {
      query = {
        _id: ObjectId(_id),
        "members": {
          $in: [userId]
        },
        deleted: false,
      }
    }

    return Promise.all([
      RoomModel.findOne(query)
      .select({
        _id: 1
      })
      .exec()
      .then(parseData),
      MemberModel.updateOne({
        _id: userId
      }, {
        $set: {
          status: ROOM_USER_NET_STATUS.ONLINE
        }
      })
    ])
    .then(([data]) => {
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

async function paramsValid(data, token) {
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
  if(type === ROOM_TYPE.CHAT && !ObjectId.isValid(_id) && members.length != 1) {
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
        if(Array.isArray(data)) return data.filter(item => ObjectId.isValid(item.trim())).map(item => ObjectId(item.trim()))
        return data.split(',').reduce((acc, cur) => {
          if(ObjectId.isValid(cur.trim())) acc.push(ObjectId(cur.trim()))
          return acc 
        }, [])
      }
    ]
  })
  let mimeId 

  const data = await paramsValid({
    ...ctx.request.body,
    members: newMembers,
    type,
  }, token)
  .then(_ => {
    if(!token) {
      return {
        memebers: newMembers,
        mime: null
      }
    }
    return formatMembers(newMembers, ObjectId(token.id))
  })
  .then(({ members, mime }) => {
    mimeId = mime 
    newMembers = members 
    return roomExists({
      ...ctx.request.body,
      members: newMembers,
    }, mimeId)
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
        // members: newMembers.map(m => {
        //   const result = {
        //     user: m,
        //     status: ROOM_USER_NET_STATUS.OFFLINE
        //   }
        //   if(!token) return result 
        //   return {
        //     ...result,
        //     status: m.equals(mimeId) ? ROOM_USER_NET_STATUS.ONLINE : ROOM_USER_NET_STATUS.OFFLINE,
        //   }
        // }),
        members: newMembers
      })
      
      return room.save()
      .then((data) => {
        const { _id } = data
        return MemberModel.updateMany({
          _id: {
            $in: newMembers
          },
        }, {
          $addToSet: {
            room: _id 
          }
        }, {
          upsert: true 
        })
        .then(_ => _id)
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