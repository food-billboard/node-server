const { Types: { ObjectId } } = require('mongoose')
const { merge, omit } = require('lodash')
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
  FriendsModel,
  notFound,
  FRIEND_STATUS
} = require('@src/utils')

async function roomExists(data, userMemberId) {
  const { _id, members, type } = data
  if(ObjectId.isValid(_id) || ( !ObjectId.isValid(_id) && type === ROOM_TYPE.CHAT ) || type === ROOM_TYPE.SYSTEM) {
    let query = {
      type,
      deleted: false 
    }
    //系统
    if(type === ROOM_TYPE.SYSTEM) {
      query = merge({}, query, {
        origin: true,
      })
      if(ObjectId.isValid(_id)) query._id = _id 
      if(ObjectId.isValid(userMemberId)) query["members"] = {
        $in: [userMemberId]
      }
    }
    //未登录
    else if(!ObjectId.isValid(userMemberId)) {
      return Promise.reject({
        errMsg: 'not authorization',
        status: 401
      })
    }
    //创建
    else if(!ObjectId.isValid(_id)) {
      query = merge({}, query, {
        members: {
          $in: members,
          $size: members.length
        },
      })
    }
    //已经存在
    else {
      query = merge({}, omit(query, ["type"]), {
        _id: ObjectId(_id),
        "members": {
          $in: [userMemberId]
        },
      })
    }

    return Promise.all([
      RoomModel.findOneAndUpdate(query, {
        $pullAll: {
          delete_users: members
        }
      })
      .select({
        _id: 1
      })
      .exec()
      .then(parseData),
      MemberModel.updateOne({
        _id: userMemberId
      }, {
        $set: {
          status: ROOM_USER_NET_STATUS.ONLINE
        },
      })
    ])
    .then(([data])=> {
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

async function formatMembers(prevMembers, userId) {
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
    let newMembers = [...prevMembers]
    if(!prevMembers.some(item => item.equals(_id))) {
      newMembers = [
        ...newMembers,
        _id
      ]
    }
    return {
      mime: _id,
      members: newMembers
    }
  })
}

async function isMembersValid(members, mime, status) {
  const toAddMembers = members.filter(item => !item.equals(mime))
  return FriendsModel.findOne({
    member: mime 
  })
  .select({
    _id: 1
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data 
    return MemberModel.aggregate([
      {
        $match: {
          _id: {
            $in: toAddMembers
          }
        }
      },
      {
        $lookup: {
          from: 'friends', 
          let: {
            member_id: "$_id"
          },
          pipeline: [  
            {
              $match: {
                $expr: {
                  $eq: [
                    "$member", "$$member_id"
                  ]
                },
                friends: {
                  $elemMatch: { 
                    $and: [
                      {
                        _id,
                      },
                      {
                        status: {
                          $in: [
                            FRIEND_STATUS.NORMAL,
                            FRIEND_STATUS.AGREE
                          ]
                        }
                      }
                    ]
                  } 
                }
              }
            },
          ],
          as: 'friends',
        }
      },
      {
        $unwind: "$friends"
      },
      {
        $project: {
          _id: 1
        }
      }
    ])
  })
  .then(data => {
    if(data.length !== toAddMembers.length) {
      if(!status) return Promise.reject({ errMsg: "不可对非好友创建群聊", status: 403 })
      return RoomModel.deleteOne({
        _id: ObjectId(status)
      })
      .then(_ => {
        return Promise.reject({ errMsg: "不可对非好友创建群聊", status: 403 })
      })
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
        members: newMembers,
        mime: null
      }
    }
    return formatMembers(newMembers, ObjectId(token.id))
  })
  .then(({ members, mime }) => {
    mimeId = mime 
    newMembers = members 
    const { _id } = ctx.request.body 
    if(newMembers.length > 100 && type !== ROOM_TYPE.SYSTEM) return Promise.reject({ errMsg: '超过最高房间成员数量', status: 403 }) 
    if(!!token && !_id && newMembers.length < 2) return Promise.reject({ errMsg: '成员数量不正确', status: 404 })
    return roomExists({
      ...ctx.request.body,
      members: newMembers,
    }, mimeId)
  })
  .then(status => {
    if(!token) return status 
    return isMembersValid(newMembers, mimeId, status)
    .then(_ => status)
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
  .then(data => {
    return MemberModel.updateMany({
      _id: {
        $in: newMembers
      }
    }, {
      $addToSet: {
        room: data
      }
    })
    .then(_ => data)
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