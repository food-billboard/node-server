const Router = require('@koa/router')
const { Types: { ObjectId } } = require('mongoose')
const { verifyTokenToData, RoomModel, dealErr, Params, responseDataDeal, ROOM_TYPE, parseData, MemberModel, Authorization, notFound } = require('@src/utils')
const joinRoom = require('./utils/join')

const router = new Router()

router
.get('/', async(ctx) => {

  const [ currPage, pageSize ] = Params.sanitizers(ctx.query, {
    name: 'currPage',
    _default: 0,
    sanitizers: [
      data => data >= 0 ? +data : 0
    ]
  }, {
    name: 'pageSize',
    _default: 30,
    sanitizers: [
      data => data >= 0 ? +data : 30
    ]
  })
  const { _id, type, origin, create_user, content, members } = ctx.query

  let match = {}
  const [, token] = verifyTokenToData(ctx)
  if(ObjectId.isValid(_id)) match._id = ObjectId(_id)
  if(!token) {
    match.type = ROOM_TYPE.SYSTEM
    match.origin = true
  }else {
    if(ROOM_TYPE[type]) match.type = type 
    if(origin !== undefined) match.origin = parseInt(origin) === 1
    if(ObjectId.isValid(create_user)) match.create_user = ObjectId(create_user)
    if(typeof content === 'string' && !!content) {
      const contentReg = {
        $regex: content,
        $options: 'ig'
      }
      match.$or = [
        {
          "info.name": contentReg
        },
        {
          "info.description": contentReg
        }
      ]
    }
    if(typeof members === 'string') {
      const list = members.split(',')
      if(!!list.length && list.every(item => ObjectId.isValid(item.trim()))) {
        match["members"] = {
          $in: list.map(item => ObjectId(item.trim()))
        }
      }
    }
  }

  const data = await RoomModel.aggregate([
    {
      $match: match
    },
    {
      $skip: currPage * pageSize
    },
    {
      $limit: pageSize
    },
    {
      $lookup: {
        from: 'members', 
        let: {
          member_id: "$create_user"
        },
        pipeline: [  
          {
            $match: {
              $expr: {
                $eq: [
                  "$_id", "$$member_id"
                ]
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              as: 'user_info',
              let: {
                user_id: "$user"
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        "$_id", "$$user_id"
                      ]
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'images',
                    as: 'avatar',
                    foreignField: "_id",
                    localField: "avatar"
                  }
                },
                {
                  $unwind: {
                    path: "$avatar",
                    preserveNullAndEmptyArrays: true 
                  }
                },
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    description: 1,
                    avatar: "$avatar.src"
                  }
                }
              ]
            }
          },
          {
            $unwind: "$user_info"
          },
          {
            $project: {
              _id: "$user_info._id",
              member: "$user",
              username: "$user_info.username",
              description: "$user_info.description",
              avatar: "$user_info.avatar",
            }
          }
        ],
        as: 'create_user',
      }
    },
    {
      $unwind: {
        path: "$create_user",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $lookup: {
        from: 'images', 
        localField: 'info.avatar', 
        foreignField: '_id', 
        as: 'info.avatar'
      }
    },
    {
      $unwind: {
        path: "$info.avatar",
        preserveNullAndEmptyArrays: true 
      }
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        updatedAt: 1,
        type: 1,
        create_user: {
          username: "$create_user.username",
          avatar: "$create_user.avatar",
          _id: "$create_user._id",
          description: "$create_user.description",
          member: "$create_user.member"
        },
        info: {
          name: "$info.name",
          description: "$info.description",
          avatar: "$info.avatar.src"
        },
        members: {
          $size: {
            $ifNull: [
              "$members", []
            ]
          }
        },
        online_members: {
          $size: {
            $ifNull: [
              "$online_members", []
            ]
          }
        },
        is_delete: "$deleted"
      }
    }
  ])
  .then(data => {
    return {
      data
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    ctx,
    needCache: false 
  })

})
.post('/', joinRoom)
//离开房间(下线)
.put('/', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: '_id',
    multipart: true,
    validator: [
			(data, origin) => {
        return origin.all == 1 ? true : ObjectId.isValid(data)
      }
		]
  })
  if(check) return 

  const [ roomId ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      (data, origin) => {
        return origin.all == '1' ? null : ObjectId(data)
      }
    ]
  })
  const { all } = ctx.request.body
  let modifiedCount = 0

  async function update() {
    const { id } = token
    const userId = ObjectId(id)
    return MemberModel.findOne({
      user: userId
    })
    .select({
      _id: 1,
      room: 1
    })
    .exec()
    .then(notFound)
    .then(data => {
      const { _id, room } = data
      modifiedCount = all == '1' ? room.length : 1
      return RoomModel.updateMany({
        _id: {
          $in: all == '1' ? room.map(item => ObjectId(item)) : [roomId]
        }
      }, {
        $pull: {
          online_members: _id
        }
      })
    })
    .then(data => {
      if(data && data.nModified != modifiedCount) return Promise.reject({ status: 403, errMsg: '暂无权限' })
      return roomId
    })
  }

  const data = await new Promise((resolve) => {
    if(token) {
      resolve(update())
    }else {
      resolve(roomId)
    }
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })
  
})
.post('/join', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.body(ctx, {
    name: '_id',
    validator: [
			data => ObjectId.isValid(data)
		]
  })
  if(check) return 
  const [ roomId ] = Params.sanitizers(ctx.request.body, {
    name: '_id',
    sanitizers: [
      data => ObjectId(data)
    ]
  })

  const data = await new Promise((resolve) => {
    if(token) {
      const { id } = token
      const userId = ObjectId(id)
      resolve(MemberModel.findOne({
        user: userId
      })
      .select({
        _id: 1,
      })
      .exec()
      .then(notFound)
      .then(data => {
        const { _id } = data
        return RoomModel.updateOne({
          _id: {
            $in: [roomId]
          }
        }, {
          $addToSet: {
            online_members: _id
          }
        })
      })
      .then(data => {
        if(data && data.nModified != 1) return Promise.reject({ status: 403, errMsg: '暂无权限' })
        return roomId
      }))
    }else {
      resolve(roomId)
    }
  })
  .then(data => ({ data }))
  .catch(dealErr(ctx))

  responseDataDeal({
    data,
    needCache: false,
    ctx
  })

})
.use(Authorization())
//删除房间
.delete('/', async(ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item.trim()))
		]
  })
  if(check) return 

  let deleteRoomList = []

  const data = await MemberModel.findOne({
    user: ObjectId(token.id)
  })
  .select({
    _id: 1,
  })
  .exec()
  .then(notFound)
  .then(data => {
    const { _id } = data 
    return RoomModel.aggregate([
      {
        $match: {
          create_user: _id,
          origin: false ,
          type: {
            $ne: ROOM_TYPE.SYSTEM
          }
        }
      },
      {
        $project: {
          _id: 1
        }
      }
    ])
  })
  .then(parseData)
  .then(data => {
    const ids = data.map(item => item._id)
    deleteRoomList = ids
    return MemberModel.findOneAndUpdate({
      user: ObjectId(token.id)
    }, {
      $pullAll: {
        room: ids
      }
    })
    .select({
      _id: 1
    })
    .exec()
    .then(notFound)
    .then(data => {
      const { _id } = data
       return RoomModel.updateMany({
        _id: {
          $in: ids
        }
      }, {
        $set: {
          deleted: true 
        },
        $addToSet: {
          delete_users: ObjectId(_id)
        },
      })
    })
  })
  .then(_ => ({ data: deleteRoomList }))
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    needCache: false,
    data 
  })

})
//退出房间
.delete('/join', async (ctx) => {
  const [, token] = verifyTokenToData(ctx)
  const check = Params.query(ctx, {
    name: '_id',
    validator: [
			data => data.split(',').every(item => ObjectId.isValid(item.trim()))
		]
  })
  if(check) return 

  const { id } = token
  const userId = ObjectId(id)
  const [ _id ] = Params.sanitizers(ctx.query, {
    name: '_id',
    sanitizers: [
      data => data.split(',').map(item => ObjectId(item.trim()))
    ]
  })

  const data = await Promise.all([
    RoomModel.find({
      _id: {
        $in: _id
      },
    })
    .select({
      type: 1,
      create_user: 1,
      members: 1,
      delete_users: 1,
    })
    .exec()
    .then(parseData),
    MemberModel.findOne({
      user: userId
    })
    .select({
      _id: 1
    })
    .exec()
    .then(parseData)
  ])
  .then(([room, member]) => {
    const { _id: memberId } = member
    let forbidden = false 
    let needNotDelete = false 
    room.forEach(item => {
      const { members, create_user, type, delete_users } = item 
      forbidden = type === ROOM_TYPE.SYSTEM || (type != ROOM_TYPE.CHAT && !create_user.equals(memberId)) || !members.some(item => item.equals(memberId))
      needNotDelete = (type === ROOM_TYPE.CHAT && (delete_users.length == 0 || !!memberId.equals(delete_users[0]))) || type === ROOM_TYPE.GROUP_CHAT
    })
    if(forbidden) return Promise.reject({
      errMsg: 'forbidden',
      status: 403
    })

    if(needNotDelete) {
      return RoomModel.updateMany({
        _id: {
          $in: _id
        },
        origin: false,
      }, {
        $addToSet: {
          delete_users: memberId
        },
        $pull: {
          online_members: memberId
        }
      })
    }else {
      const toDeleteRoomIds = _id.filter(roomId => room.some(item => item._id.equals(roomId) && !item.create_user.equals(memberId)))
      return RoomModel.remove({
        _id: {
          $in: toDeleteRoomIds
        },
        origin: false,
        // ...(type === ROOM_TYPE.CHAT ? {} : { create_user: data }),
      }, {
        single: true
      })
    }
  })
  .then(_ => {
    return MemberModel.updateOne({
      user: userId,
    }, {
      $pullAll: {
        room: _id
      }
    })
  })
  .then(_ => {
    return {
      data: _id
    }
  })
  .catch(dealErr(ctx))

  responseDataDeal({
    ctx,
    data,
    needCache: false 
  })

})

module.exports = router